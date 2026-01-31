# Runbook: Scaling Operations

Procedures for scaling RideNDine services horizontally and vertically to handle increased load.

**Last Updated:** 2026-01-31
**Severity:** Medium
**Estimated Time:** 10-30 minutes
**Required Access:** kubectl/docker, cloud console, monitoring dashboards

---

## Objective

Scale services to handle increased traffic, maintain performance during peak hours, and optimize resource utilization.

---

## When to Scale

### Scale Up Triggers

| Metric               | Threshold         | Action                            |
| -------------------- | ----------------- | --------------------------------- |
| CPU Usage            | > 75% for 10+ min | Scale horizontally                |
| Memory Usage         | > 85%             | Scale vertically or horizontally  |
| API Latency          | P95 > 500ms       | Scale horizontally                |
| Queue Depth          | > 1000 items      | Scale workers                     |
| Database Connections | > 80% of pool     | Increase pool size or add replica |
| Error Rate           | > 1%              | Investigate, then scale           |

### Scale Down Triggers

| Metric            | Threshold         | Action               |
| ----------------- | ----------------- | -------------------- |
| CPU Usage         | < 30% for 30+ min | Scale down           |
| Memory Usage      | < 40% for 30+ min | Scale down           |
| Traffic           | < 50% of capacity | Reduce replicas      |
| Cost Optimization | Off-peak hours    | Scheduled scale-down |

---

## Horizontal Scaling (Add Replicas)

### Kubernetes

**Scale API service:**

```bash
# Check current replicas
kubectl get deployment api -n ridendine

# Scale up to 5 replicas
kubectl scale deployment/api --replicas=5 -n ridendine

# Verify scaling
kubectl get pods -n ridendine -l app=api -w

# Check rollout status
kubectl rollout status deployment/api -n ridendine
```

**Auto-scaling (HPA):**

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: ridendine
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

```bash
# Apply HPA
kubectl apply -f k8s/hpa.yaml

# Check HPA status
kubectl get hpa api-hpa -n ridendine -w
```

---

### Docker Compose

```bash
# Scale up to 3 replicas
docker-compose up -d --scale api=3

# Verify
docker-compose ps api

# Add load balancer (nginx) if not present
# Edit docker-compose.yml to add nginx service
```

---

### ECS (AWS)

```bash
# Update desired count
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --desired-count 5

# Enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/ridendine-production/api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 3 \
  --max-capacity 10

# Create scaling policy (target tracking)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/ridendine-production/api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name api-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## Vertical Scaling (Increase Resources)

### Kubernetes

**Increase CPU/Memory limits:**

```yaml
# k8s/api-deployment.yaml
spec:
  template:
    spec:
      containers:
        - name: api
          resources:
            requests:
              cpu: 1000m # Increased from 500m
              memory: 1Gi # Increased from 512Mi
            limits:
              cpu: 2000m # Increased from 1000m
              memory: 2Gi # Increased from 1Gi
```

```bash
# Apply changes
kubectl apply -f k8s/api-deployment.yaml

# Watch rollout
kubectl rollout status deployment/api -n ridendine

# Verify new resources
kubectl describe pod <pod-name> -n ridendine | grep -A 5 "Limits\|Requests"
```

---

### Docker Compose

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0' # Increased from 1.0
          memory: 2G # Increased from 1G
        reservations:
          cpus: '1.0' # Increased from 0.5
          memory: 1G # Increased from 512M
```

```bash
# Apply changes
docker-compose up -d api

# Verify
docker stats api
```

---

### ECS (AWS)

```bash
# Create new task definition with increased resources
# Edit task definition JSON:
{
  "cpu": "1024",           // Increased from 512
  "memory": "2048",        // Increased from 1024
  "containerDefinitions": [...]
}

# Register new task definition
aws ecs register-task-definition --cli-input-json file://task-definition-v2.json

# Update service to use new definition
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --task-definition ridendine-api:2
```

---

## Database Scaling

### Read Replicas

**Create read replica (RDS):**

```bash
# Create replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier ridendine-prod-replica-1 \
  --source-db-instance-identifier ridendine-production-db \
  --db-instance-class db.t3.large \
  --availability-zone us-east-1b

# Wait for replica to be available
aws rds wait db-instance-available \
  --db-instance-identifier ridendine-prod-replica-1
```

**Route read queries to replica:**

```typescript
// services/api/src/config/database.config.ts
export const databaseConfig = {
  replication: {
    master: {
      host: process.env.DATABASE_HOST,
      port: 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    },
    slaves: [
      {
        host: process.env.DATABASE_REPLICA_HOST,
        port: 5432,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
      },
    ],
  },
};

// Use replica for read queries
const chefs = await this.chefRepository.find({}, { slave: true });
```

---

### Increase Connection Pool

```typescript
// services/api/src/config/database.config.ts
extra: {
  max: 40,                    // Increased from 20
  min: 10,                    // Increased from 5
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}
```

```bash
# Restart API to apply changes
kubectl rollout restart deployment/api -n ridendine
```

---

### Vertical Scaling (Bigger Instance)

**RDS:**

```bash
# Modify instance class
aws rds modify-db-instance \
  --db-instance-identifier ridendine-production-db \
  --db-instance-class db.r5.xlarge \
  --apply-immediately

# Monitor modification
aws rds describe-db-instances \
  --db-instance-identifier ridendine-production-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Expected: modifying -> available
```

---

## Redis Scaling

### Add Redis Cluster Nodes

**ElastiCache:**

```bash
# Increase replica count
aws elasticache increase-replica-count \
  --replication-group-id ridendine-production-redis \
  --new-replica-count 3 \
  --apply-immediately
```

**Redis Cluster (Kubernetes):**

```yaml
# k8s/redis-statefulset.yaml
spec:
  replicas: 5 # Increased from 3
```

```bash
kubectl apply -f k8s/redis-statefulset.yaml
```

---

## Load Balancer Scaling

### Nginx

**Increase worker processes:**

```nginx
# nginx.conf
worker_processes auto;  # Or specific number like 8
worker_connections 4096;  # Increased from 1024

events {
    use epoll;
    multi_accept on;
}
```

### AWS Application Load Balancer

```bash
# ALB automatically scales
# Monitor target group health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/ridendine-api/xxx
```

---

## Scheduled Scaling

### Peak Hours Scaling

**Kubernetes CronJobs:**

```yaml
# k8s/scale-up-cron.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-up
  namespace: ridendine
spec:
  schedule: '0 9 * * *' # 9 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: kubectl
              image: bitnami/kubectl:latest
              command:
                - /bin/sh
                - -c
                - kubectl scale deployment/api --replicas=8 -n ridendine
          restartPolicy: OnFailure
```

**Scale down at night:**

```yaml
# k8s/scale-down-cron.yaml
spec:
  schedule: '0 22 * * *' # 10 PM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: kubectl
              command:
                - kubectl scale deployment/api --replicas=3 -n ridendine
```

---

## Monitoring Scaling Operations

### Check Metrics

```bash
# Kubernetes
kubectl top pods -n ridendine
kubectl top nodes

# Check HPA status
kubectl get hpa -n ridendine -w

# View scaling events
kubectl get events -n ridendine --sort-by='.lastTimestamp' | grep -i scale
```

### Verify Load Distribution

```bash
# Check requests per pod
kubectl get pods -n ridendine -l app=api -o wide

# Test load balancing
for i in {1..100}; do
  curl -s http://api.ridendine.com/health | jq -r '.hostname'
done | sort | uniq -c
```

---

## Scaling Checklist

**Before Scaling:**

- [ ] Current metrics reviewed (CPU, memory, latency)
- [ ] Capacity planning completed
- [ ] Budget approved (for cloud resources)
- [ ] Monitoring dashboards ready
- [ ] Alerts configured

**During Scaling:**

- [ ] Scale operation initiated
- [ ] New instances launched successfully
- [ ] Health checks passing
- [ ] Load distributed evenly
- [ ] No increase in errors

**After Scaling:**

- [ ] Metrics improved (latency, throughput)
- [ ] Error rate stable
- [ ] Cost impact acceptable
- [ ] Documentation updated
- [ ] Auto-scaling configured (if applicable)

---

## Rollback

If scaling causes issues:

```bash
# Kubernetes: Scale back down
kubectl scale deployment/api --replicas=3 -n ridendine

# ECS: Revert service count
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --desired-count 3

# RDS: Downgrade instance (requires downtime)
aws rds modify-db-instance \
  --db-instance-identifier ridendine-production-db \
  --db-instance-class db.t3.medium \
  --apply-immediately
```

---

## Cost Optimization

### Right-sizing

```bash
# Analyze resource usage over 30 days
kubectl top pods -n ridendine --containers | awk '{sum+=$2} END {print "Avg CPU:", sum/NR}'

# Recommendations:
# - If CPU < 30% consistently: Scale down or use smaller instance
# - If CPU > 80% consistently: Scale up
# - If memory < 50% consistently: Reduce memory limits
```

### Spot Instances (AWS)

```bash
# Use spot instances for non-critical workloads
# Edit ECS task definition:
{
  "requiresCompatibilities": ["FARGATE"],
  "capacityProviderStrategy": [
    {
      "capacityProvider": "FARGATE_SPOT",
      "weight": 4
    },
    {
      "capacityProvider": "FARGATE",
      "weight": 1
    }
  ]
}
```

---

## Best Practices

1. **Start with horizontal scaling** (easier to rollback)
2. **Monitor for 15 minutes** after scaling
3. **Scale gradually** (don't jump from 3 to 10 replicas immediately)
4. **Test auto-scaling in staging** first
5. **Document scaling decisions** (why, when, results)
6. **Set up budget alerts** for cloud costs
7. **Review scaling needs quarterly**

---

## Contact

- **DevOps Team:** devops@ridendine.com
- **On-call:** Slack #ridendine-ops
- **Cost Optimization:** finops@ridendine.com

---

**Last Updated:** 2026-01-31
**Maintained By:** DevOps Team
