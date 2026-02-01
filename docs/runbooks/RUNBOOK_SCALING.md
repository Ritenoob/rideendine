# Runbook: Scaling Services

**Purpose:** Scale RideNDine services to handle increased load or reduce costs

**Severity:** Medium
**Estimated Time:** 5-10 minutes
**Risk Level:** Low

## When to Use This Runbook

- High traffic anticipated (marketing campaign, event)
- Current services at capacity (high CPU/memory)
- Cost optimization (scale down during low traffic)
- Performance degradation due to load
- Preparation for load testing

## Prerequisites

- [ ] kubectl access to cluster
- [ ] Monitoring dashboard open
- [ ] Current resource usage known
- [ ] Approval for cost impact (if scaling up significantly)

## Scaling Strategies

### Horizontal Scaling (Recommended)

Add more replicas of the same service.

**Advantages:**
- Better fault tolerance
- Can handle more requests
- No downtime

**Disadvantages:**
- Higher cost
- Requires load balancer

### Vertical Scaling

Increase CPU/memory of existing pods.

**Advantages:**
- Simpler for some workloads
- May be cheaper than horizontal

**Disadvantages:**
- Requires pod restart
- Limited by node size
- Less fault tolerant

## Horizontal Scaling Procedures

### Manual Scaling

#### API Service

```bash
# Check current replicas
kubectl get deployment api -n ridendine

# Scale up to 10 replicas
kubectl scale deployment/api --replicas=10 -n ridendine

# Monitor scaling
kubectl get pods -l app=api -n ridendine -w

# Verify new pods are ready
kubectl wait --for=condition=ready pod -l app=api -n ridendine --timeout=300s

# Check load distribution
kubectl top pods -l app=api -n ridendine
```

#### Dispatch Service

```bash
# Scale dispatch service
kubectl scale deployment/dispatch --replicas=5 -n ridendine

# Monitor
kubectl rollout status deployment/dispatch -n ridendine
```

#### Routing Service

```bash
# Scale routing service
kubectl scale deployment/routing --replicas=4 -n ridendine

# Monitor
kubectl get pods -l app=routing -n ridendine
```

#### Realtime Gateway

```bash
# Scale realtime service
kubectl scale deployment/realtime --replicas=6 -n ridendine

# Monitor WebSocket connections distribution
kubectl logs -l app=realtime -n ridendine | grep "connection"
```

### Automatic Scaling (HPA)

Horizontal Pod Autoscaler automatically adjusts replicas based on metrics.

#### Configure HPA for API

```bash
# Create HPA (if not exists)
kubectl autoscale deployment api \
  --min=3 \
  --max=20 \
  --cpu-percent=70 \
  -n ridendine

# View HPA status
kubectl get hpa -n ridendine

# Describe HPA for details
kubectl describe hpa api -n ridendine

# Expected output:
# Name:                                                  api
# Namespace:                                             ridendine
# Reference:                                             Deployment/api
# Metrics:                                               ( current / target )
#   resource cpu on pods  (as a percentage of request):  45% / 70%
# Min replicas:                                          3
# Max replicas:                                          20
# Deployment pods:                                       3 current / 3 desired
```

#### Configure HPA for Other Services

```bash
# Dispatch
kubectl autoscale deployment dispatch \
  --min=2 \
  --max=10 \
  --cpu-percent=70 \
  -n ridendine

# Routing
kubectl autoscale deployment routing \
  --min=2 \
  --max=8 \
  --cpu-percent=60 \
  -n ridendine

# Realtime
kubectl autoscale deployment realtime \
  --min=2 \
  --max=12 \
  --cpu-percent=65 \
  -n ridendine
```

#### Custom Metrics HPA (Advanced)

Scale based on custom metrics (requests per second, queue depth, etc.):

```bash
# Example: Scale based on HTTP requests per second
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa-custom
  namespace: ridendine
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
EOF
```

## Vertical Scaling Procedures

### Increase Resource Limits

```bash
# Edit deployment to increase resources
kubectl edit deployment api -n ridendine

# Or use kubectl patch
kubectl patch deployment api -n ridendine --type='json' -p='[
  {
    "op": "replace",
    "path": "/spec/template/spec/containers/0/resources/limits/memory",
    "value": "1Gi"
  },
  {
    "op": "replace",
    "path": "/spec/template/spec/containers/0/resources/limits/cpu",
    "value": "1000m"
  }
]'

# This will trigger a rolling update
kubectl rollout status deployment/api -n ridendine
```

### Recommended Resource Configurations

| Service | Low Load | Medium Load | High Load |
|---------|----------|-------------|-----------|
| **API** |
| CPU Request | 200m | 500m | 1000m |
| CPU Limit | 500m | 1000m | 2000m |
| Memory Request | 256Mi | 512Mi | 1Gi |
| Memory Limit | 512Mi | 1Gi | 2Gi |
| **Dispatch** |
| CPU Request | 100m | 250m | 500m |
| CPU Limit | 300m | 500m | 1000m |
| Memory Request | 128Mi | 256Mi | 512Mi |
| Memory Limit | 256Mi | 512Mi | 1Gi |
| **Routing** |
| CPU Request | 100m | 250m | 500m |
| CPU Limit | 300m | 500m | 1000m |
| Memory Request | 128Mi | 256Mi | 512Mi |
| Memory Limit | 256Mi | 512Mi | 1Gi |
| **Realtime** |
| CPU Request | 100m | 250m | 500m |
| CPU Limit | 300m | 500m | 1000m |
| Memory Request | 128Mi | 256Mi | 512Mi |
| Memory Limit | 256Mi | 512Mi | 1Gi |

## Database Scaling

### PostgreSQL Read Replicas (Advanced)

For read-heavy workloads:

```bash
# Add read replica StatefulSet
kubectl apply -f k8s/base/postgres-read-replica.yaml

# Update application to use read replica for queries
# Write: postgres-0.postgres (primary)
# Read: postgres-read-0.postgres-read (replica)
```

### Connection Pooling

Use PgBouncer for connection pooling:

```bash
# Deploy PgBouncer
kubectl apply -f k8s/base/pgbouncer.yaml

# Update application DATABASE_HOST to pgbouncer
kubectl set env deployment/api \
  DATABASE_HOST=pgbouncer \
  -n ridendine
```

## Redis Scaling

### Redis Cluster (Advanced)

For high-throughput caching:

```bash
# Deploy Redis Cluster
kubectl apply -f k8s/base/redis-cluster.yaml

# Update application REDIS_URL to cluster
kubectl set env deployment/api \
  REDIS_URL=redis://redis-cluster:6379 \
  -n ridendine
```

## Monitoring Scaling Events

### Real-Time Monitoring

```bash
# Watch pods scale
watch kubectl get pods -n ridendine

# Monitor HPA events
kubectl get hpa -n ridendine -w

# Check resource usage
watch kubectl top pods -n ridendine
```

### Grafana Dashboard

Check metrics:
- CPU utilization per pod
- Memory utilization per pod
- Request rate per pod
- Pod count over time
- Scaling events

### Prometheus Queries

```promql
# Number of replicas over time
kube_deployment_status_replicas{deployment="api"}

# CPU usage
rate(container_cpu_usage_seconds_total{pod=~"api-.*"}[5m])

# Memory usage
container_memory_usage_bytes{pod=~"api-.*"}

# Request rate per pod
rate(http_requests_total{pod=~"api-.*"}[5m])
```

## Docker Compose Scaling

```bash
# Scale API service to 3 instances
docker-compose up -d --scale api=3

# Verify
docker-compose ps

# Note: Requires external load balancer or manually manage ports
```

## Pre-Event Scaling Checklist

For planned high-traffic events:

- [ ] Identify expected traffic increase (2x, 5x, 10x)
- [ ] Calculate required replicas
- [ ] Pre-scale services 15 minutes before event
- [ ] Verify all replicas healthy
- [ ] Monitor dashboard open
- [ ] On-call engineer available
- [ ] Rollback plan ready

### Example: Scale for 10x Traffic

```bash
# Normal load: 3 API replicas
# Expected: 10x traffic increase
# Scale to: 30 replicas (with buffer)

kubectl scale deployment/api --replicas=30 -n ridendine
kubectl scale deployment/dispatch --replicas=10 -n ridendine
kubectl scale deployment/routing --replicas=8 -n ridendine
kubectl scale deployment/realtime --replicas=12 -n ridendine

# Wait for all pods ready
kubectl wait --for=condition=ready pod -l component=backend -n ridendine --timeout=600s

# Verify cluster has capacity
kubectl describe nodes | grep -A 5 "Allocated resources"
```

## Post-Event Scale Down

After event, scale back to reduce costs:

```bash
# Scale back to normal levels
kubectl scale deployment/api --replicas=3 -n ridendine
kubectl scale deployment/dispatch --replicas=2 -n ridendine
kubectl scale deployment/routing --replicas=2 -n ridendine
kubectl scale deployment/realtime --replicas=2 -n ridendine

# Or let HPA handle it automatically
# HPA will scale down based on metrics
```

## Cost Optimization

### Scheduled Scaling (Development/Staging)

```bash
# Scale down during off-hours (11 PM - 7 AM)
# Add to CronJob or use external tool

# Example CronJob for scale down
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-down-nightly
  namespace: ridendine
spec:
  schedule: "0 23 * * *"  # 11 PM daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scale-manager
          containers:
          - name: kubectl
            image: bitnami/kubectl:latest
            command:
            - /bin/sh
            - -c
            - |
              kubectl scale deployment/api --replicas=1 -n ridendine
              kubectl scale deployment/dispatch --replicas=1 -n ridendine
          restartPolicy: OnFailure

# Scale up in morning
# schedule: "0 7 * * *"  # 7 AM daily
```

## Troubleshooting

### Issue: Pods Not Scaling Up

**Symptoms:**
- kubectl scale command runs but pods don't increase
- HPA not creating new pods

**Resolution:**
```bash
# Check node capacity
kubectl describe nodes | grep -A 10 "Allocated resources"

# If nodes at capacity, add more nodes or use smaller resource requests

# Check HPA conditions
kubectl describe hpa api -n ridendine

# Look for events like:
# "unable to fetch metrics" - metrics-server issue
# "unable to scale" - insufficient resources
```

### Issue: Uneven Load Distribution

**Symptoms:**
- Some pods handling more traffic than others
- CPU usage varies significantly between pods

**Resolution:**
```bash
# Check service load balancing
kubectl describe svc api -n ridendine

# Verify all pods are endpoints
kubectl get endpoints api -n ridendine

# If using Kubernetes service, it should load balance evenly
# If not, consider using Istio or other service mesh
```

### Issue: Memory Leak After Scaling

**Symptoms:**
- New pods use more memory than old pods
- Memory constantly increasing

**Resolution:**
```bash
# Restart pods with memory leak
kubectl rollout restart deployment/api -n ridendine

# Monitor memory over time
kubectl top pod -l app=api -n ridendine

# If leak persists, requires code fix
```

## Success Criteria

- [ ] Desired number of replicas running
- [ ] All pods in "Running" state
- [ ] Health checks passing on all pods
- [ ] Load distributed evenly (if applicable)
- [ ] No increase in error rate
- [ ] Response times acceptable
- [ ] Monitoring shows improved metrics

## Related Runbooks

- [Restart Services](./RUNBOOK_RESTART_SERVICES.md)
- [Incident Response](./RUNBOOK_INCIDENT_RESPONSE.md)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2024-01-15 | DevOps | Initial version |
