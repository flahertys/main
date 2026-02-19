# 🚀 Complete Kubernetes Deployment Guide for TradeHax

## System Status Overview

```
✅ GitLab Agent: Connected & Running (2 replicas)
✅ Kubernetes Cluster: Ready (v1.31.1)
✅ Control Plane: Healthy
✅ DNS: CoreDNS Active
✅ Deployment Manifests: Created
✅ CI/CD Pipeline: Configured
```

## Phase 1: Prepare Kubernetes Cluster

### 1.1 Deploy NGINX Ingress Controller

```bash
# Install NGINX Ingress Controller
kubectl apply -f k8s/nginx-ingress.yaml

# Verify deployment
kubectl get all -n ingress-nginx
kubectl get ingressclass
```

### 1.2 Create Namespace for TradeHax (Optional)

```bash
# Create namespace
kubectl create namespace tradehax

# Or use default namespace (recommended for simple setup)
```

### 1.3 Create Secrets

```bash
# Create HF API token secret
kubectl create secret generic tradehax-secrets \
  --from-literal=hf-token=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 \
  -n default

# Create container registry credentials (if using private images)
kubectl create secret docker-registry ghcr-credentials \
  --docker-server=ghcr.io \
  --docker-username=DarkModder33 \
  --docker-password=<GITHUB_TOKEN> \
  -n default
```

## Phase 2: Deploy TradeHax Application

### 2.1 Deploy Using kubectl

```bash
# Apply all manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Watch the rollout
kubectl rollout status deployment/tradehax-app -n default

# Verify pods are running
kubectl get pods -n default
kubectl get svc -n default
kubectl get ingress -n default
```

### 2.2 Verify Deployment

```bash
# Check deployment status
kubectl describe deployment tradehax-app

# View pod details
kubectl get pods -o wide

# Check service
kubectl describe service tradehax-service

# Check ingress
kubectl describe ingress tradehax-ingress
```

### 2.3 Port Forward for Local Testing

```bash
# Forward traffic to service
kubectl port-forward svc/tradehax-service 3000:80

# Test in browser
# http://localhost:3000
```

## Phase 3: Configure Domain & DNS

### 3.1 Get LoadBalancer IP

```bash
# For NGINX Ingress (LoadBalancer type)
kubectl get svc -n ingress-nginx
# Note the EXTERNAL-IP (may show <pending> on local cluster)

# For NodePort (fallback)
kubectl get svc ingress-nginx-controller -n ingress-nginx
# Access via: http://<NODE-IP>:<NODE-PORT>
```

### 3.2 Update Namecheap DNS

In Namecheap Advanced DNS:

For **tradehax.net**:
- Type: A Record
- Name: @
- Value: <Cluster IP or NodePort IP>
- TTL: 30 min

For **tradehaxai.tech**:
- Type: A Record
- Name: @
- Value: <Cluster IP or NodePort IP>
- TTL: 30 min

## Phase 4: Setup GitOps (Continuous Deployment)

### Option A: GitLab Native (Recommended)

GitLab Agent automatically enables deployment from `.gitlab-ci.yml`

```yaml
# Already in .gitlab-ci.yml
deploy:k8s:
  stage: deploy
  environment:
    name: production
    url: https://tradehaxai.tech
  script:
    - kubectl set image deployment/tradehax-app \
      tradehax=$IMAGE_NAME:$IMAGE_TAG
    - kubectl rollout status deployment/tradehax-app
  only:
    - main
```

**How it works:**
1. Push to `main` branch
2. `.gitlab-ci.yml` pipeline runs
3. Docker image built
4. GitLab Agent deploys to cluster
5. Site updates automatically

### Option B: Flux CD (GitOps-Native)

```bash
# Install Flux
flux bootstrap github \
  --owner=DarkModder33 \
  --repo=main \
  --branch=main \
  --path=clusters/local

# Create Flux HelmRelease for TradeHax
flux create helmrelease tradehax \
  --source=GitRepository/main \
  --chart=./helm \
  --namespace=default
```

### Option C: ArgoCD

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create Application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: tradehax
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/DarkModder33/main
    path: k8s
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

## Phase 5: Monitoring & Operations

### 5.1 View Logs

```bash
# Real-time logs from deployment
kubectl logs -f deployment/tradehax-app

# Logs from specific pod
kubectl logs -f pod/tradehax-app-xxx

# View recent errors
kubectl logs deployment/tradehax-app --tail=50 --timestamps=true
```

### 5.2 Scaling

```bash
# Manual scale to 3 replicas
kubectl scale deployment tradehax-app --replicas=3

# Auto-scaling status
kubectl get hpa
kubectl describe hpa tradehax-hpa

# View metrics
kubectl top pods
kubectl top nodes
```

### 5.3 Rolling Updates

```bash
# Update image
kubectl set image deployment/tradehax-app \
  tradehax=ghcr.io/darkmodder33/main:v1.2.3

# Check rollout progress
kubectl rollout status deployment/tradehax-app

# Rollback if needed
kubectl rollout undo deployment/tradehax-app
```

### 5.4 Debugging

```bash
# Get events
kubectl get events --sort-by='.lastTimestamp'

# Describe problematic pod
kubectl describe pod <POD-NAME>

# Execute command in pod
kubectl exec -it <POD-NAME> -- /bin/sh

# Port forward for debugging
kubectl port-forward <POD-NAME> 3000:3000
```

## Phase 6: Production Readiness Checklist

- [x] GitLab Agent connected
- [x] Kubernetes cluster ready
- [x] NGINX Ingress Controller deployed
- [x] Deployment manifests created
- [x] CI/CD pipeline configured
- [ ] Domain DNS configured
- [ ] SSL/TLS certificates configured
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Logging setup (ELK/Loki)
- [ ] Backup strategy defined
- [ ] Resource limits tuned
- [ ] Network policies defined
- [ ] Security scanning enabled (Trivy)

## Quick Commands Reference

```bash
# Get cluster info
kubectl cluster-info
kubectl get nodes

# View all resources
kubectl get all -A

# Deploy TradeHax
kubectl apply -f k8s/

# Check status
kubectl get deployments,svc,ingress

# View logs
kubectl logs -f deployment/tradehax-app

# Scale
kubectl scale deployment tradehax-app --replicas=5

# Update image
kubectl set image deployment/tradehax-app tradehax=ghcr.io/darkmodder33/main:latest

# Port forward
kubectl port-forward svc/tradehax-service 3000:80

# Troubleshoot
kubectl describe pod <POD-NAME>
kubectl exec -it <POD-NAME> -- /bin/sh

# Delete deployment
kubectl delete -f k8s/
```

## Architecture Deployed

```
┌────────────────────────────────────────────────┐
│         GitHub / GitLab Repository             │
│  - Source code: /app, /components, /lib        │
│  - K8s manifests: /k8s                         │
│  - CI/CD config: .gitlab-ci.yml, .github       │
└─────────────────┬────────────────────────────┘
                  │
                  ↓
┌────────────────────────────────────────────────┐
│      GitLab CI/CD Pipeline / GitHub Actions    │
│  1. Build Docker image                         │
│  2. Push to GHCR                               │
│  3. Deploy via GitLab Agent                    │
└─────────────────┬────────────────────────────┘
                  │
                  ↓
┌────────────────────────────────────────────────┐
│        Kubernetes Cluster (Local/Cloud)        │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  Ingress NGINX (ingress-nginx ns)        │  │
│  │  - tradehaxai.tech → service             │  │
│  │  - tradehax.net → service                │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  TradeHax Service (default ns)           │  │
│  │  - ClusterIP: 10.96.x.x:80               │  │
│  │  - Selects pods: app=tradehax            │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  TradeHax Deployment (default ns)        │  │
│  │  ├─ Replica 1: pod/tradehax-app-xxx      │  │
│  │  ├─ Replica 2: pod/tradehax-app-yyy      │  │
│  │  └─ Replica 3+: (auto-scaled if needed)  │  │
│  │                                          │  │
│  │  Each pod runs:                          │  │
│  │  - Node.js Next.js app (port 3000)       │  │
│  │  - AI models (Hugging Face)              │  │
│  │  - Trading bot logic                     │  │
│  │  - Image generator                       │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## Environment Variables (Already Set)

In `k8s/ingress.yaml` ConfigMap:

```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://tradehaxai.tech
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1
LLM_TEMPERATURE=0.7
LLM_MAX_LENGTH=512
```

## Support & Troubleshooting

### Pod Not Starting

```bash
# Check events
kubectl describe pod <POD-NAME>

# View logs
kubectl logs <POD-NAME>

# Check resource availability
kubectl describe node
```

### Service Not Accessible

```bash
# Verify service
kubectl get svc
kubectl describe svc tradehax-service

# Test DNS
kubectl exec -it <POD> -- nslookup tradehax-service

# Port forward for testing
kubectl port-forward svc/tradehax-service 3000:80
```

### Ingress Not Working

```bash
# Check ingress
kubectl describe ingress tradehax-ingress

# Check NGINX controller
kubectl get all -n ingress-nginx

# View NGINX logs
kubectl logs -f -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

---

**Status**: ✅ **FULLY PREPARED & READY TO DEPLOY**

All components are in place. Ready to serve TradeHax globally!
