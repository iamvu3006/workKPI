# WorkKPI

> **An enterprise-grade internal task management and KPI measurement system**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/iamvu3006/workKPI)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x+-success)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-orange)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Development](#development)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [API Conventions](#api-conventions)
- [Security & Authorization](#security--authorization)
- [Development Guidelines](#development-guidelines)
- [Available Scripts](#available-scripts)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)

---

## Overview

**WorkKPI** is a comprehensive internal task management and KPI (Key Performance Indicator) measurement platform designed to replace manual spreadsheet-based workflows. It enables enterprises to:

- **Centralize task management** across departments and teams
- **Measure KPI transparently** with data-driven insights
- **Enforce role-based access control** (RBAC) with multi-level permissions
- **Automate KPI calculations** based on task completion and quality scores
- **Streamline approval workflows** for task review and deadline extensions
- **Generate actionable reports** for decision-makers at all levels

### Mission & Vision

**Mission:** Digitize and automate internal work management and KPI tracking to replace fragmented tools (Google Sheets, messaging apps) and reduce reporting overhead.

**Vision:** Build a fast, reliable, transparent system that becomes the single source of truth for organizational performance tracking.

### Target Users

- **Executives (BGĐ):** Real-time company-wide KPI dashboards and trend analysis
- **Department Managers (Trưởng phòng):** Team task oversight, KPI tracking, and performance reviews
- **Team Leaders (Leader):** Task delegation, team progress monitoring, sub-task management
- **Employees (Nhân viên):** Personal task tracking, KPI monitoring, deadline management

### Success Metrics

- 100% user adoption for progress reporting
- <15 minutes per week for executive summary generation
- 99.9% system uptime and data safety guarantee

---

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** 10+ (comes with Node.js) or **pnpm**/**yarn**
- **PostgreSQL** or **Supabase project** with database access
- A code editor (VS Code recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/iamvu3006/workKPI.git
   cd workKPI
