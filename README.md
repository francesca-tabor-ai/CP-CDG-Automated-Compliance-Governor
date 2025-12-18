# Automated Compliance Governor – Claims Data Governance (CP-CDG)

## Overview

The **Automated Compliance Governor for Claims Data Governance (CP-CDG)** is a Minimum Viable Product (MVP) that demonstrates **Compliance-by-Design** in an AI-native software delivery pipeline.

This project replaces passive regulatory documentation with **active, executable governance** by using AI to generate both:

* **Production code** that enforces a regulatory rule, and
* **Executable tests** that prove the enforcement is correct.

Governance is no longer reviewed after deployment—it is **compiled, tested, and enforced before deployment**.

---

## What This MVP Proves

* Regulatory requirements can be translated directly into deterministic code
* Compliance can be enforced as a hard CI/CD quality gate
* AI can generate both system behavior and its own compliance validation
* Speed of delivery does not require sacrificing security or compliance

This is a foundational pattern for **AI-Native Governance** and **Zero-Trust SDLC**.

---

## MVP Scope

### Governance Rule Enforced

> **All customer Policy Holder Names (PII) must be masked using the approved internal masking utility before being written to the Claims Log Service (CLS).**

### What's Included

* Claims Data Governance Module (CP-CDG) implemented in C#/.NET
* Approved internal masking utility usage (per ADRs)
* AI-generated xUnit/NUnit compliance tests
* CI/CD enforcement via Airflow
* Deployment target: Azure Container Apps

### What's Not Included

* Other PII fields (e.g., SSN, DOB)
* Runtime production monitoring
* Manual compliance review workflows

---

## How It Works

### 1. Governance as Input

Regulatory rules and architectural constraints are injected into the AI using a **RAG-backed Context Store**, including:

* Regulatory documentation
* Platform ADRs (Architectural Decision Records)
* Approved utility signatures

### 2. Dual-Output AI Generation

A single structured prompt produces:

1. **Production Code**: A CP-CDG C# class that enforces PII masking before logging
2. **Executable Test Suite**: xUnit/NUnit tests that explicitly assert the governance rule

The AI is responsible for both implementation and enforcement.

### 3. Automated CI/CD Enforcement

* Airflow orchestrates build and test execution
* Governance tests run automatically
* Deployment is **blocked** if any governance test fails
* Only compliant code is promoted to Azure Container Apps

This turns compliance into a **non-negotiable quality gate**.

---

## Repository Structure

```
/src
  /CP-CDG
    ClaimsDataGovernance.cs

/tests
  /CP-CDG.Tests
    ClaimsDataGovernanceTests.cs

/docs
  governance-rule.md
  adr-references.md

/.airflow
  pipeline.yaml

README.md
```

---

## Key Design Principles

* **Compliance-by-Design**: Governance is enforced in code, not documentation.
* **Executable Compliance**: Tests are the proof. If it passes, it complies.
* **AI-Native SDLC**: AI generates both the system and the constraints that govern it.
* **Fail Fast, Fail Safe**: Non-compliant code never reaches production.

---

## Who This Is For

* Platform Engineers building CI/CD quality gates
* Claims Application Developers (.NET/C#)
* Security & Compliance Engineers
* Risk, Legal, and Audit teams
* AI / Prompt Engineers designing governance-to-code workflows

---

## Audit & Traceability

Each governance rule in this repository maps to:

* Source regulatory documentation
* Architectural Decision Records (ADRs)
* Production enforcement code
* Executable compliance tests

This provides **verifiable, machine-executable audit evidence**.

---

## Extending This MVP

This pattern is designed to scale:

* Add new governance rules by adding new prompts
* Generate new enforcement modules + tests
* Chain multiple governance rules into a single compliance suite
* Extend beyond claims into underwriting, billing, and customer data platforms

---

## Key Takeaway

> **In an AI-Native Pipeline, the system that writes the code is also responsible for writing the rules that prove the code is safe to run.**

This repository is a concrete demonstration that **speed, security, and compliance are not trade-offs—they are co-products**.
