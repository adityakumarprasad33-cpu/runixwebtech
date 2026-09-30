# Runix Backup, Disaster Recovery & Data Protection Policy

## 1. Scope & Storage Systems
- **Primary Database**: Firebase Firestore & PostgreSQL (User Accounts, Orders, Client Inquiries, Audit Logs).
- **Static Assets & Deployments**: Edge CDN Storage, S3 / Cloud Storage Buckets (Optimized AVIF/WebP assets, deliverables).
- **Environment & Secrets**: Cloud Secret Manager with automated versioning.

---

## 2. Backup Schedule & Strategy

| Asset Type | Backup Frequency | Mechanism | Target Storage Location |
| :--- | :--- | :--- | :--- |
| **User & Order DB** | Continuous (PITR) + Daily Snapshot (02:00 UTC) | Automated Cloud Snapshot & WAL Archival | Encrypted Cross-Region Cloud Bucket |
| **Audit Logs** | Hourly export | Immutable Append-Only Bucket with WORM retention | Cold Archive (Encrypted) |
| **Repository & Config** | Git Push + Daily Archive | GitHub Enterprise + Encrypted Offsite Clone | Secondary Multi-Region Storage |

---

## 3. Retention Policies
- **Continuous Point-in-Time Recovery (PITR)**: 35 days continuous roll-back capability.
- **Daily Snapshots**: Retained for 90 days.
- **Monthly Snapshots**: Retained for 12 months for compliance and auditing.
- **Audit Logs**: Retained for 7 years (tamper-proof).

---

## 4. Disaster Recovery Targets
- **Recovery Point Objective (RPO)**: < 5 minutes (via streaming write-ahead logs / Firestore managed backups).
- **Recovery Time Objective (RTO)**: < 30 minutes (fully automated failover via load balancer to standby cluster).

---

## 5. Standard Operating Procedure: Database Restoration

1. **Initiate Incident & Isolation**:
   ```bash
   # Switch Load Balancer to Maintenance Mode
   gcloud compute backend-services update runix-backend --custom-response-header="Retry-After: 300"
   ```

2. **Select Target Snapshot**:
   Identify the latest verified clean snapshot prior to the incident timestamp:
   ```bash
   gcloud firestore backups list --location=asia-south1
   ```

3. **Restore to Staging Cluster First**:
   ```bash
   gcloud firestore databases restore \
     --source-backup=projects/runix-prod/locations/asia-south1/backups/RUNIX_DAILY_2026_09_30 \
     --destination-database=runix-recovery-staging
   ```

4. **Verify Integrity & Consistency**:
   Execute automated verification scripts:
   - Check unique constraint validation (emails, provider IDs, payment transaction IDs).
   - Verify checksums on latest orders and payment state machines.
   - Run idempotency checks on unsettled callbacks.

5. **Promote Staging to Production**:
   Switch DNS/connection strings to the recovered cluster and re-enable traffic.

---

## 6. Restore Drill & Verification Schedule
- **Automated Restore Drill**: Executed on the 1st of every month in an isolated staging environment.
- **Verification Criteria**: Zero data truncation, intact user sessions, and 100% foreign-key/constraint integrity verified.
