# RideNDine Kubernetes Deployment

This directory contains Kubernetes manifests for deploying RideNDine to a Kubernetes cluster.

## Directory Structure

```
k8s/
├── base/                          # Base manifests (environment-agnostic)
│   ├── namespace.yaml             # Namespace definition
│   ├── postgres-deployment.yaml   # PostgreSQL StatefulSet + Service
│   ├── redis-deployment.yaml      # Redis StatefulSet + Service
│   ├── api-deployment.yaml        # API Deployment + Service + HPA
│   ├── dispatch-deployment.yaml   # Dispatch Deployment + Service
│   ├── routing-deployment.yaml    # Routing Deployment + Service
│   ├── realtime-deployment.yaml   # Realtime Deployment + Service
│   ├── configmap.yaml             # Application configuration
│   ├── secrets-example.yaml       # Example secrets (DO NOT USE IN PROD)
│   └── ingress.yaml               # Ingress configuration
├── overlays/                      # Environment-specific overlays
│   ├── dev/                       # Development environment
│   ├── staging/                   # Staging environment
│   └── prod/                      # Production environment
└── README.md                      # This file
```

## Prerequisites

1. **Kubernetes Cluster** (v1.25+)
   - Minikube (local development)
   - Kind (local development)
   - GKE, EKS, AKS (cloud)

2. **kubectl** CLI tool

   ```bash
   kubectl version --client
   ```

3. **Helm** (optional, for cert-manager and ingress controller)

   ```bash
   helm version
   ```

4. **Container Registry**
   - Docker Hub
   - Google Container Registry (GCR)
   - Amazon Elastic Container Registry (ECR)
   - Azure Container Registry (ACR)

## Quick Start

### 1. Build and Push Images

```bash
# Build all images
npm run docker:build

# Tag images for your registry
docker tag ridendine-api:latest gcr.io/your-project/ridendine-api:latest
docker tag ridendine-dispatch:latest gcr.io/your-project/ridendine-dispatch:latest
docker tag ridendine-routing:latest gcr.io/your-project/ridendine-routing:latest
docker tag ridendine-realtime:latest gcr.io/your-project/ridendine-realtime:latest

# Push to registry
docker push gcr.io/your-project/ridendine-api:latest
docker push gcr.io/your-project/ridendine-dispatch:latest
docker push gcr.io/your-project/ridendine-routing:latest
docker push gcr.io/your-project/ridendine-realtime:latest
```

### 2. Create Namespace

```bash
kubectl apply -f k8s/base/namespace.yaml
```

### 3. Create Secrets

**DO NOT use secrets-example.yaml in production!**

Create secrets from command line:

```bash
# PostgreSQL credentials
kubectl create secret generic postgres-secret \
  --from-literal=username=ridendine \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  --from-literal=database=ridendine \
  -n ridendine

# Application secrets
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=YOUR_JWT_SECRET_MIN_32_CHARACTERS \
  --from-literal=refresh-token-secret=YOUR_REFRESH_SECRET_MIN_32_CHARACTERS \
  -n ridendine

# Stripe secrets
kubectl create secret generic stripe-secrets \
  --from-literal=secret-key=sk_live_PLACEHOLDER_REPLACE_ME \  # Replace with actual key
  --from-literal=publishable-key=pk_live_PLACEHOLDER_REPLACE_ME \  # Replace with actual key
  --from-literal=webhook-secret=whsec_PLACEHOLDER_REPLACE_ME \  # Replace with actual secret
  -n ridendine

# Routing provider secrets
kubectl create secret generic routing-secrets \
  --from-literal=mapbox-token=pk.PLACEHOLDER_REPLACE_ME \  # Replace with actual token
  --from-literal=google-maps-key=PLACEHOLDER_REPLACE_ME \  # Replace with actual key
  -n ridendine
```

### 4. Apply ConfigMaps

```bash
kubectl apply -f k8s/base/configmap.yaml
```

### 5. Deploy Database Layer

```bash
# PostgreSQL
kubectl apply -f k8s/base/postgres-deployment.yaml

# Redis
kubectl apply -f k8s/base/redis-deployment.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n ridendine --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n ridendine --timeout=300s
```

### 6. Deploy Application Services

```bash
# API Service
kubectl apply -f k8s/base/api-deployment.yaml

# Dispatch Service
kubectl apply -f k8s/base/dispatch-deployment.yaml

# Routing Service
kubectl apply -f k8s/base/routing-deployment.yaml

# Realtime Service
kubectl apply -f k8s/base/realtime-deployment.yaml

# Wait for services to be ready
kubectl wait --for=condition=ready pod -l app=api -n ridendine --timeout=300s
```

### 7. Setup Ingress

First, install NGINX Ingress Controller:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
```

Install cert-manager (for SSL certificates):

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

Apply ingress:

```bash
kubectl apply -f k8s/base/ingress.yaml
```

### 8. Verify Deployment

```bash
# Check all pods
kubectl get pods -n ridendine

# Check services
kubectl get svc -n ridendine

# Check ingress
kubectl get ingress -n ridendine

# View logs
kubectl logs -f deployment/api -n ridendine

# Port forward for local testing
kubectl port-forward svc/api 9001:9001 -n ridendine
```

## Local Development with Minikube

### 1. Start Minikube

```bash
minikube start --memory=4096 --cpus=2
```

### 2. Enable Addons

```bash
minikube addons enable ingress
minikube addons enable metrics-server
```

### 3. Load Docker Images (skip registry push)

```bash
# Build images
npm run docker:build

# Load into Minikube
minikube image load ridendine-api:latest
minikube image load ridendine-dispatch:latest
minikube image load ridendine-routing:latest
minikube image load ridendine-realtime:latest
```

### 4. Deploy as Normal

Follow steps 2-7 from Quick Start.

### 5. Access Services

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts
echo "$(minikube ip) api.ridendine.com ws.ridendine.com" | sudo tee -a /etc/hosts

# Or use port-forward
kubectl port-forward svc/api 9001:9001 -n ridendine
```

## Scaling

### Manual Scaling

```bash
# Scale API to 5 replicas
kubectl scale deployment/api --replicas=5 -n ridendine

# Scale dispatch to 3 replicas
kubectl scale deployment/dispatch --replicas=3 -n ridendine
```

### Horizontal Pod Autoscaler (HPA)

HPA is already configured for API service (see `api-deployment.yaml`):

```bash
# View HPA status
kubectl get hpa -n ridendine

# Describe HPA
kubectl describe hpa api-hpa -n ridendine
```

Configure HPA for other services:

```bash
kubectl autoscale deployment dispatch \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n ridendine
```

## Rolling Updates

### Update Image

```bash
# Build new version
docker build -t gcr.io/your-project/ridendine-api:v2 ./services/api
docker push gcr.io/your-project/ridendine-api:v2

# Update deployment
kubectl set image deployment/api \
  api=gcr.io/your-project/ridendine-api:v2 \
  -n ridendine

# Monitor rollout
kubectl rollout status deployment/api -n ridendine
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/api -n ridendine

# Rollback to previous version
kubectl rollout undo deployment/api -n ridendine

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=2 -n ridendine
```

## Monitoring

### Resource Usage

```bash
# Pod resource usage
kubectl top pods -n ridendine

# Node resource usage
kubectl top nodes
```

### Logs

```bash
# Tail logs from all API pods
kubectl logs -f -l app=api -n ridendine

# Logs from specific pod
kubectl logs -f api-7d8b5c4f9-abcde -n ridendine

# Previous container logs (after crash)
kubectl logs --previous api-7d8b5c4f9-abcde -n ridendine
```

### Events

```bash
# View events
kubectl get events -n ridendine --sort-by='.lastTimestamp'

# Watch events
kubectl get events -n ridendine --watch
```

## Database Management

### Run Migrations

```bash
# Create a job to run migrations
kubectl create job --from=cronjob/db-migrate db-migrate-manual -n ridendine

# Or exec into API pod
kubectl exec -it deployment/api -n ridendine -- npm run db:migrate
```

### Backup Database

```bash
# Port forward PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n ridendine

# In another terminal, run backup
pg_dump -h localhost -U ridendine ridendine > backup.sql
```

### Restore Database

```bash
# Port forward PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n ridendine

# In another terminal, run restore
psql -h localhost -U ridendine ridendine < backup.sql
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod POD_NAME -n ridendine

# Check logs
kubectl logs POD_NAME -n ridendine

# Check previous container (if crashed)
kubectl logs POD_NAME --previous -n ridendine
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n ridendine

# Test service from inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://api:9001/health
```

### Database Connection Issues

```bash
# Check if PostgreSQL is ready
kubectl get pods -l app=postgres -n ridendine

# Test connection
kubectl exec -it deployment/api -n ridendine -- \
  psql postgresql://ridendine:PASSWORD@postgres:5432/ridendine -c "SELECT 1"
```

## Security Best Practices

1. **Never commit secrets to version control**
2. Use **Secret Management** solutions:
   - Sealed Secrets
   - External Secrets Operator
   - Cloud provider secret management (AWS Secrets Manager, GCP Secret Manager)
3. Enable **Pod Security Policies** or **Pod Security Standards**
4. Use **Network Policies** to restrict traffic between pods
5. Run containers as **non-root users** (already configured)
6. Enable **RBAC** (Role-Based Access Control)
7. Scan images for **vulnerabilities** before deployment
8. Use **TLS/SSL** for all external traffic
9. Implement **resource quotas** and **limit ranges**
10. Enable **audit logging**

## Production Checklist

- [ ] Use managed databases (Cloud SQL, RDS, Azure Database)
- [ ] Setup external secret management
- [ ] Configure SSL certificates (cert-manager + Let's Encrypt)
- [ ] Enable monitoring (Prometheus + Grafana)
- [ ] Setup logging aggregation (ELK, Loki)
- [ ] Configure alerts (AlertManager, PagerDuty)
- [ ] Implement backup strategy
- [ ] Enable autoscaling (HPA, Cluster Autoscaler)
- [ ] Setup CI/CD pipeline
- [ ] Configure network policies
- [ ] Enable pod security standards
- [ ] Implement disaster recovery plan
- [ ] Document runbooks
- [ ] Load test before going live

## Cleanup

```bash
# Delete all resources in namespace
kubectl delete namespace ridendine

# Or delete individual resources
kubectl delete -f k8s/base/
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
