# System Design Interview Guide — CommitCamp Official

A structured way to answer “design X at scale” questions in ~45 minutes.

## 1. Clarify (5 min)

- Functional requirements (read/write, latency, consistency).
- Non-functional: scale (DAU, QPS), availability, durability, compliance.
- Out of scope: explicitly say what you will not optimize first.

## 2. High-level design (10 min)

- Draw clients, API gateway / load balancers, core services, data stores.
- Name protocols: REST vs gRPC, sync vs async (queues).
- Call out single points of failure early.

## 3. Data model (10 min)

- Entities, relationships, access patterns (read-heavy vs write-heavy).
- Choose SQL vs NoSQL vs cache vs search index with one sentence *why*.
- Sharding key if horizontal scale is required.

## 4. Deep dives (15 min)

Pick 2–3 from: caching, replication, CAP tradeoffs, idempotency, rate limiting, observability, security (authN/Z, PII).

## 5. Tradeoffs & failure (5 min)

- What breaks first under load; how you’d degrade (circuit breaker, stale reads).
- How to roll out safely (feature flags, shadow traffic).

## Mini checklist

- [ ] Back-of-envelope: QPS, storage, bandwidth.
- [ ] Idempotent writes where money or inventory involved.
- [ ] Monitoring: metrics, logs, traces, SLOs.

---

*CommitCamp marketplace — official digital product.*
