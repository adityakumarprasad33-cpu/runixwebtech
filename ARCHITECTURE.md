# Runix Production Architecture & Domain System

This document specifies the four architectural pillars of Runix.in for multi-instance stateless deployment, authoritative domain isolation, and real-world resilience.

---

## 1. System / Infrastructure Architecture

Stateless, horizontally scalable application nodes fronted by edge DNS/CDN and load balancing.

```mermaid
flowchart TD
    User([End User / Client]) --> DNS[Cloudflare DNS / CDN / Edge WAF]
    DNS --> LB[Cloud Load Balancer]
    
    subgraph Compute ["Stateless Application Tier"]
        LB --> APP1[Runix Node App #1]
        LB --> APP2[Runix Node App #2]
        LB --> APP3[Runix Node App #3]
    end

    subgraph CacheAndCoordination ["Distributed Coordination & Cache"]
        APP1 <--> REDIS[(Distributed Redis / Rate Limiter)]
        APP2 <--> REDIS
        APP3 <--> REDIS
    end

    subgraph AsyncWork ["Asynchronous Job Queue & Workers"]
        APP1 --> QUEUE[Task Queue Engine]
        APP2 --> QUEUE
        APP3 --> QUEUE
        QUEUE --> W1[Worker Process 1]
        QUEUE --> W2[Worker Process 2]
        W1 --> DLQ[(Dead Letter Queue - DLQ)]
        W2 --> DLQ
    end

    subgraph DurableStorage ["Durable Shared Data Layer"]
        APP1 <--> DB[(PostgreSQL / Firebase Firestore)]
        APP2 <--> DB
        APP3 <--> DB
        W1 <--> DB
        W2 <--> DB
    end
```

---

## 2. Authentication & Identity Architecture

Authoritative server-side identity verification with zero client trust and distributed rate-limited endpoints.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Edge as Edge WAF / Rate Limit
    participant AuthContext as Client AuthContext (UI State)
    participant AuthAPI as /api/auth/login or OAuth
    participant IdentityService as Identity Domain (Authoritative)
    participant DB as Durable User Store

    User->>Edge: POST /api/auth/login (email, password)
    Edge->>Edge: Verify Distributed Rate Limit (5 / 5m)
    Edge->>AuthAPI: Forward Sanitized Request
    AuthAPI->>IdentityService: Validate Credentials & Session Tokens
    IdentityService->>DB: Query User Record & Check Status
    DB-->>IdentityService: User Record (Hashed Secret, Role, EmailVerified)
    IdentityService->>IdentityService: Verify Password & Sign HttpOnly Session Cookie
    IdentityService->>IdentityService: Emit Security Audit Event (login_success)
    IdentityService-->>AuthAPI: Authoritative Session Claims (Role, UID)
    AuthAPI-->>User: Set-Cookie: __session (HttpOnly, Secure, SameSite=Strict)
    User->>AuthContext: Hydrate UI State (uid, email, role)
```

---

## 3. Commerce & Payment Architecture

Strict authoritative pricing snapshots, explicit payment state machine, and replay-proof idempotency keys.

```mermaid
stateDiagram-v2
    [*] --> CREATED : Order initialized with Price Snapshot
    CREATED --> PAYMENT_PENDING : Gateway Transaction Created
    PAYMENT_PENDING --> PROCESSING : Payment Webhook Dispatched
    PROCESSING --> SUCCESS : Cryptographic Signature Verified
    PROCESSING --> FAILED : Payment Declined / Rejected
    PROCESSING --> EXPIRED : Payment Window Timed Out
    SUCCESS --> ORDER_CONFIRMED : Milestone Confirmed (50% Advance)
    FAILED --> PAYMENT_PENDING : User Re-attempts Payment
    EXPIRED --> [*]
    ORDER_CONFIRMED --> [*]
```

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Browser
    participant API as /api/orders & /api/payments
    participant Commerce as Commerce Domain (Authoritative)
    participant Gateway as Paytm / Payment Provider
    participant DB as Orders DB

    Client->>API: POST /api/orders (planId, addonIds)
    API->>Commerce: createOrderPricingSnapshot(planId, addons)
    Note over Commerce: Catalog snapshot frozen (version v2026.1). Client cannot dictate price.
    Commerce->>DB: Save Order Record (State: CREATED, Snapshot)
    Commerce-->>Client: Order Created (order_id, advance_amount)

    Client->>Gateway: Submit Payment
    Gateway->>API: POST /api/payments/callback (checksum, txnId, orderId)
    API->>Commerce: processIdempotentPaymentCallback(idempotencyKey, txnId)
    Commerce->>Commerce: Check idempotency cache (Duplicate callback protection)
    Commerce->>Commerce: Verify Gateway Checksum / Signature
    Commerce->>DB: Transition state to SUCCESS -> ORDER_CONFIRMED
    Commerce-->>Gateway: HTTP 200 (Settled)
    Commerce-->>Client: Confirm Order & Launch Staging
```

---

## 4. Operations, Observability & Recovery Architecture

Real-time telemetry, structured sanitized logging, health checks, and resilient error tracking.

```mermaid
flowchart LR
    subgraph Traffic ["Traffic & Health"]
        Probe[Load Balancer Health Probe] -->|GET /api/health| APIHealth[/api/health]
        APIHealth -->|Status 200| OK[Healthy / In-Service]
    end

    subgraph Telemetry ["Telemetry & Auditing"]
        App[Application Code] -->|Structured Log| Logger[Observability Engine]
        Logger -->|Redact Passwords & Tokens| Sanitizer[Secret Redaction Filter]
        Sanitizer --> Storage[(Central Log Collector / CloudWatch)]
        App -->|Security Audit Event| Audit[(Immutable Audit Log)]
    end

    subgraph Resilience ["Backpressure & DLQ"]
        Workers[Background Workers] -->|On 3 Failures| DLQ[Dead Letter Queue]
        DLQ --> Alert[Ops Alerting & PagerDuty]
        Alert --> Recovery[Admin Reconciliation Run]
    end
```
