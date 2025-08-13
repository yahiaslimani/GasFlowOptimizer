# Gas Pipeline Network Capacity Planning System

## Overview

This is a gas pipeline network capacity planning and optimization system designed to support commercial operations in natural gas transmission. The system models pipeline infrastructure including supply sources (receipt points), delivery points, compressor stations, and pipeline segments to enable efficient capacity management, operational planning, and commercial optimization.

The application focuses on integrating operational data with commercial rules and market requirements to maximize throughput, minimize operational costs, and support regulatory compliance for gas pipeline operators.

## User Preferences

Preferred communication style: Simple, everyday language.

## Project Migration Status

**Migration Date:** August 12, 2025
**Status:** In Progress - Web Interface Development

### Migration Changes:
- ✓ Installed .NET 8.0 runtime and SDK
- ✓ Restored NuGet packages (Google OR-Tools 9.8.3296, System.Text.Json 8.0.5)
- ✓ Fixed security vulnerability by updating System.Text.Json from 8.0.4 to 8.0.5
- ✓ Converted from console application to ASP.NET Core web application
- ✓ Created comprehensive web interface with interactive network diagram
- ✓ Implemented drag-and-drop network design functionality
- ✓ Added optimization settings panel and results visualization
- ✓ Configured workflow for web deployment and application serving
- ✓ Fixed coordinate layout for better network visualization 
- ✓ Improved label movement to stick with nodes during dragging
- ✓ Enhanced optimization failure indication and result highlighting

### New Web Interface Features:
- Interactive network diagram with SVG-based visualization
- Drag-and-drop point creation and positioning (Receipt, Delivery, Compressor stations)
- Real-time segment connection between points
- Optimization settings panel with algorithm selection
- Results display with segment flows, point pressures, and compressor usage
- Import/Export functionality for network configurations
- Responsive design optimized for pipeline operators

### Security Improvements:
- Updated System.Text.Json package to address known high severity vulnerability (GHSA-8g4q-xg66-9fp4)
- Implemented proper client-server separation with REST API architecture
- Added CORS configuration for secure cross-origin requests

## System Architecture

### Core Data Model
- **Point-based Architecture**: The system uses a point-centric model where each network node (receipt points, delivery points, compressor stations) is defined with comprehensive operational and commercial attributes
- **Configuration-driven Design**: Network topology and operational parameters are stored in JSON configuration files, enabling flexible network modeling without code changes
- **Pressure and Flow Management**: Each point maintains pressure constraints (min/max), current operating conditions, and capacity limits to support hydraulic modeling

### Network Topology Management
- **Graph-based Network Representation**: Pipeline segments connect points to form a directed graph representing gas flow paths
- **Multi-type Node Support**: Handles different point types (Receipt, Delivery, Compressor) with type-specific operational characteristics
- **Spatial Positioning**: Includes coordinate system (x,y) for network visualization and geographic representation

### Capacity Planning Engine
- **Supply and Demand Modeling**: Tracks supply capacity at receipt points and demand requirements at delivery points
- **Constraint-based Optimization**: Incorporates pressure constraints, compressor boost capabilities, and fuel consumption rates
- **Cost Optimization**: Includes unit costs and operational expenses for economic optimization scenarios

### Operational State Management
- **Real-time Status Tracking**: Maintains current operational state (pressures, flows, active/inactive status)
- **Dynamic Configuration**: Supports runtime changes to network configuration and operational parameters
- **Fuel Consumption Modeling**: Tracks compressor fuel usage rates for operational cost calculations

## External Dependencies

### Infrastructure Integration Points
- **SCADA Systems**: Integration capability for real-time operational data from pipeline control systems
- **Hydraulic Simulation Tools**: Designed to work with tools like Synergi Gas or Pipeline Studio for physical capacity validation
- **GIS/Asset Management**: Integration points for infrastructure topology and asset information

### Commercial System Integration
- **Contract Management Systems**: Interface for tracking shipper agreements and capacity rights
- **Nomination/Scheduling Systems**: Integration for daily operational nominations and capacity utilization
- **Billing Systems**: Connection points for commercial settlements and capacity charges

### Regulatory and Reporting
- **Regulatory Reporting Systems**: Support for compliance reporting to regulatory bodies (CER/FERC)
- **Market Systems**: Integration capability for secondary capacity market transactions

### Optional Advanced Integrations
- **AI/ML Platforms**: Framework for predictive analytics and demand forecasting
- **Digital Twin Systems**: Integration points for real-time operational comparison and validation