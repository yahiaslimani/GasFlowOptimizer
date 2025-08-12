// Interactive Network Diagram Component
class NetworkDiagram {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.pointsGroup = document.getElementById('points');
        this.segmentsGroup = document.getElementById('segments');
        
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedElement = null;
        this.connectingFrom = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.svg.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    render(network) {
        this.network = network;
        this.clearCanvas();
        this.renderSegments();
        this.renderPoints();
    }

    clearCanvas() {
        this.pointsGroup.innerHTML = '';
        this.segmentsGroup.innerHTML = '';
    }

    renderPoints() {
        Object.values(this.network.points || {}).forEach(point => {
            this.createPointElement(point);
        });
    }

    renderSegments() {
        Object.values(this.network.segments || {}).forEach(segment => {
            this.createSegmentElement(segment);
        });
    }

    createPointElement(point) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('point');
        g.classList.add(point.type?.toLowerCase() || 'receipt');
        g.setAttribute('data-id', point.id);
        g.setAttribute('data-type', 'point');

        // Point circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x || 50);
        circle.setAttribute('cy', point.y || 50);
        circle.setAttribute('r', this.getPointRadius(point.type));
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '2');

        // Point label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', point.x || 50);
        label.setAttribute('y', (point.y || 50) + this.getPointRadius(point.type) + 15);
        label.setAttribute('class', 'point-label');
        label.textContent = point.name || point.id;

        // Additional info based on type
        if (point.type === 'Receipt' && point.supplyCapacity) {
            const infoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            infoText.setAttribute('x', point.x || 50);
            infoText.setAttribute('y', (point.y || 50) + this.getPointRadius(point.type) + 30);
            infoText.setAttribute('class', 'point-label');
            infoText.setAttribute('style', 'font-size: 10px; fill: #666;');
            infoText.textContent = `S: ${point.supplyCapacity.toFixed(0)}`;
            g.appendChild(infoText);
        } else if (point.type === 'Delivery' && point.demandRequirement) {
            const infoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            infoText.setAttribute('x', point.x || 50);
            infoText.setAttribute('y', (point.y || 50) + this.getPointRadius(point.type) + 30);
            infoText.setAttribute('class', 'point-label');
            infoText.setAttribute('style', 'font-size: 10px; fill: #666;');
            infoText.textContent = `D: ${point.demandRequirement.toFixed(0)}`;
            g.appendChild(infoText);
        } else if (point.type === 'Compressor' && point.maxPressureBoost) {
            const infoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            infoText.setAttribute('x', point.x || 50);
            infoText.setAttribute('y', (point.y || 50) + this.getPointRadius(point.type) + 30);
            infoText.setAttribute('class', 'point-label');
            infoText.setAttribute('style', 'font-size: 10px; fill: #666;');
            infoText.textContent = `P: ${point.maxPressureBoost.toFixed(0)} psi`;
            g.appendChild(infoText);
        }

        g.appendChild(circle);
        g.appendChild(label);

        // Event listeners
        g.addEventListener('click', (e) => this.handleElementClick(e, point, 'point'));
        g.addEventListener('dblclick', (e) => this.handleElementDoubleClick(e, point, 'point'));

        this.pointsGroup.appendChild(g);
    }

    createSegmentElement(segment) {
        const fromPoint = this.network.points[segment.fromPointId];
        const toPoint = this.network.points[segment.toPointId];
        
        if (!fromPoint || !toPoint) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('segment');
        g.setAttribute('data-id', segment.id);
        g.setAttribute('data-type', 'segment');

        // Segment line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromPoint.x || 50);
        line.setAttribute('y1', fromPoint.y || 50);
        line.setAttribute('x2', toPoint.x || 50);
        line.setAttribute('y2', toPoint.y || 50);
        line.setAttribute('class', 'segment');

        // Segment label (capacity)
        const midX = ((fromPoint.x || 50) + (toPoint.x || 50)) / 2;
        const midY = ((fromPoint.y || 50) + (toPoint.y || 50)) / 2;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', midX);
        label.setAttribute('y', midY - 5);
        label.setAttribute('class', 'segment-label');
        label.textContent = segment.capacity ? `${segment.capacity.toFixed(0)}` : '';

        g.appendChild(line);
        g.appendChild(label);

        // Event listeners
        g.addEventListener('click', (e) => this.handleElementClick(e, segment, 'segment'));
        g.addEventListener('dblclick', (e) => this.handleElementDoubleClick(e, segment, 'segment'));

        this.segmentsGroup.appendChild(g);
    }

    getPointRadius(type) {
        switch (type) {
            case 'Receipt': return 12;
            case 'Delivery': return 12;
            case 'Compressor': return 15;
            default: return 10;
        }
    }

    handleCanvasClick(e) {
        if (e.target === this.svg || e.target.closest('.point, .segment')) return;

        const rect = this.svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (window.app.currentTool !== 'select') {
            this.createElementAtPosition(x, y);
        } else {
            this.clearSelection();
        }
    }

    createElementAtPosition(x, y) {
        const tool = window.app.currentTool;
        
        if (tool === 'receipt' || tool === 'delivery' || tool === 'compressor') {
            const pointType = tool.charAt(0).toUpperCase() + tool.slice(1);
            const pointId = `${pointType.charAt(0)}${Object.keys(this.network.points || {}).length + 1}`;
            
            const point = {
                id: pointId,
                name: `${pointType} Point ${Object.keys(this.network.points || {}).length + 1}`,
                type: pointType,
                x: x,
                y: y,
                supplyCapacity: pointType === 'Receipt' ? 500 : 0,
                demandRequirement: pointType === 'Delivery' ? 300 : 0,
                minPressure: 300,
                maxPressure: 1000,
                currentPressure: 500,
                maxPressureBoost: pointType === 'Compressor' ? 300 : 0,
                fuelConsumptionRate: pointType === 'Compressor' ? 0.02 : 0,
                unitCost: pointType === 'Receipt' ? 2.5 : 0,
                isActive: true
            };

            this.network.points[pointId] = point;
            this.createPointElement(point);
            window.app.updateNetworkStats();
            window.app.updateStatus(`${pointType} point created`);
        }
    }

    handleElementClick(e, element, type) {
        e.stopPropagation();

        if (window.app.currentTool === 'connect' && type === 'point') {
            this.handleConnectionTool(element);
            return;
        }

        this.selectElement(element, type);
    }

    handleElementDoubleClick(e, element, type) {
        e.stopPropagation();
        
        if (type === 'point') {
            window.app.selectedElement = { ...element, type: 'point' };
            window.app.showPointModal(element);
        } else if (type === 'segment') {
            window.app.selectedElement = { ...element, type: 'segment' };
            window.app.showSegmentModal(element);
        }
    }

    handleConnectionTool(point) {
        if (!this.connectingFrom) {
            this.connectingFrom = point;
            this.highlightPoint(point.id, true);
            window.app.updateStatus(`Select destination point for connection from ${point.id}`);
        } else if (this.connectingFrom.id !== point.id) {
            this.createConnection(this.connectingFrom, point);
            this.highlightPoint(this.connectingFrom.id, false);
            this.connectingFrom = null;
            window.app.updateStatus(`Connection created`);
        }
    }

    createConnection(fromPoint, toPoint) {
        const segmentId = `S${Object.keys(this.network.segments || {}).length + 1}`;
        
        const segment = {
            id: segmentId,
            name: `${fromPoint.id} to ${toPoint.id}`,
            fromPointId: fromPoint.id,
            toPointId: toPoint.id,
            capacity: 500,
            length: this.calculateDistance(fromPoint, toPoint),
            diameter: 24,
            frictionFactor: 0.015,
            pressureDropConstant: 0.0001,
            transportationCost: 0.1,
            currentFlow: 0,
            isActive: true,
            isBidirectional: false,
            minFlow: 0
        };

        this.network.segments[segmentId] = segment;
        this.createSegmentElement(segment);
        window.app.updateNetworkStats();
    }

    calculateDistance(point1, point2) {
        const dx = (point1.x || 0) - (point2.x || 0);
        const dy = (point1.y || 0) - (point2.y || 0);
        return Math.sqrt(dx * dx + dy * dy) * 0.1; // Scale factor for realistic miles
    }

    selectElement(element, type) {
        this.clearSelection();
        
        this.selectedElement = { ...element, type };
        window.app.selectedElement = this.selectedElement;
        
        const elementGroup = document.querySelector(`[data-id="${element.id}"]`);
        if (elementGroup) {
            elementGroup.classList.add('selected');
        }

        this.showElementProperties(element, type);
    }

    clearSelection() {
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.selectedElement = null;
        window.app.selectedElement = null;
        
        // Clear connection mode
        if (this.connectingFrom) {
            this.highlightPoint(this.connectingFrom.id, false);
            this.connectingFrom = null;
        }
    }

    highlightPoint(pointId, highlight) {
        const pointElement = document.querySelector(`[data-id="${pointId}"]`);
        if (pointElement) {
            if (highlight) {
                pointElement.classList.add('connecting');
            } else {
                pointElement.classList.remove('connecting');
            }
        }
    }

    showElementProperties(element, type) {
        const container = document.getElementById('propertiesContent');
        
        if (type === 'point') {
            container.innerHTML = `
                <div class="property-item">
                    <strong>Point: ${element.name}</strong>
                </div>
                <div class="property-item">
                    <label>ID:</label> ${element.id}
                </div>
                <div class="property-item">
                    <label>Type:</label> ${element.type}
                </div>
                <div class="property-item">
                    <label>Position:</label> (${(element.x || 0).toFixed(0)}, ${(element.y || 0).toFixed(0)})
                </div>
                ${element.type === 'Receipt' ? `
                <div class="property-item">
                    <label>Supply:</label> ${element.supplyCapacity || 0} MMscfd
                </div>` : ''}
                ${element.type === 'Delivery' ? `
                <div class="property-item">
                    <label>Demand:</label> ${element.demandRequirement || 0} MMscfd
                </div>` : ''}
                ${element.type === 'Compressor' ? `
                <div class="property-item">
                    <label>Max Boost:</label> ${element.maxPressureBoost || 0} psi
                </div>` : ''}
                <div class="property-item">
                    <label>Pressure Range:</label> ${element.minPressure || 0} - ${element.maxPressure || 0} psia
                </div>
                <div class="property-actions">
                    <button class="btn btn-primary btn-small" onclick="window.app.showPointModal(window.app.selectedElement)">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            `;
        } else if (type === 'segment') {
            container.innerHTML = `
                <div class="property-item">
                    <strong>Segment: ${element.name}</strong>
                </div>
                <div class="property-item">
                    <label>ID:</label> ${element.id}
                </div>
                <div class="property-item">
                    <label>From:</label> ${element.fromPointId}
                </div>
                <div class="property-item">
                    <label>To:</label> ${element.toPointId}
                </div>
                <div class="property-item">
                    <label>Capacity:</label> ${element.capacity || 0} MMscfd
                </div>
                <div class="property-item">
                    <label>Length:</label> ${element.length || 0} miles
                </div>
                <div class="property-item">
                    <label>Cost:</label> $${element.transportationCost || 0}/MMscf
                </div>
                <div class="property-actions">
                    <button class="btn btn-primary btn-small" onclick="window.app.showSegmentModal(window.app.selectedElement)">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            `;
        }
    }

    handleMouseDown(e) {
        const pointElement = e.target.closest('.point');
        if (pointElement && window.app.currentTool === 'select') {
            this.isDragging = true;
            const rect = this.svg.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left - parseFloat(pointElement.querySelector('circle').getAttribute('cx'));
            this.dragOffset.y = e.clientY - rect.top - parseFloat(pointElement.querySelector('circle').getAttribute('cy'));
            
            this.svg.classList.add('dragging');
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedElement && this.selectedElement.type === 'point') {
            const rect = this.svg.getBoundingClientRect();
            const newX = e.clientX - rect.left - this.dragOffset.x;
            const newY = e.clientY - rect.top - this.dragOffset.y;

            this.updatePointPosition(this.selectedElement.id, newX, newY);
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.svg.classList.remove('dragging');
        }
    }

    updatePointPosition(pointId, x, y) {
        const point = this.network.points[pointId];
        if (point) {
            point.x = Math.max(20, Math.min(x, this.svg.clientWidth - 20));
            point.y = Math.max(20, Math.min(y, this.svg.clientHeight - 20));
            
            // Update point element
            const pointElement = document.querySelector(`[data-id="${pointId}"] circle`);
            const labelElement = document.querySelector(`[data-id="${pointId}"] .point-label`);
            
            if (pointElement) {
                pointElement.setAttribute('cx', point.x);
                pointElement.setAttribute('cy', point.y);
            }
            if (labelElement) {
                labelElement.setAttribute('x', point.x);
                labelElement.setAttribute('y', point.y + this.getPointRadius(point.type) + 15);
            }

            // Update connected segments
            this.updateConnectedSegments(pointId);
        }
    }

    updateConnectedSegments(pointId) {
        Object.values(this.network.segments || {}).forEach(segment => {
            if (segment.fromPointId === pointId || segment.toPointId === pointId) {
                const segmentElement = document.querySelector(`[data-id="${segment.id}"] line`);
                if (segmentElement) {
                    const fromPoint = this.network.points[segment.fromPointId];
                    const toPoint = this.network.points[segment.toPointId];
                    
                    if (fromPoint && toPoint) {
                        segmentElement.setAttribute('x1', fromPoint.x || 50);
                        segmentElement.setAttribute('y1', fromPoint.y || 50);
                        segmentElement.setAttribute('x2', toPoint.x || 50);
                        segmentElement.setAttribute('y2', toPoint.y || 50);
                        
                        // Update segment label position
                        const labelElement = document.querySelector(`[data-id="${segment.id}"] .segment-label`);
                        if (labelElement) {
                            const midX = ((fromPoint.x || 50) + (toPoint.x || 50)) / 2;
                            const midY = ((fromPoint.y || 50) + (toPoint.y || 50)) / 2;
                            labelElement.setAttribute('x', midX);
                            labelElement.setAttribute('y', midY - 5);
                        }
                    }
                }
            }
        });
    }

    showOptimizationResults(result) {
        if (!result || !result.segmentFlows) return;

        // Show flows on segments
        Object.entries(result.segmentFlows).forEach(([segmentId, flow]) => {
            const segmentGroup = document.querySelector(`[data-id="${segmentId}"]`);
            if (segmentGroup) {
                segmentGroup.classList.add('optimized');
                
                // Add flow label
                const existingFlowLabel = segmentGroup.querySelector('.flow-label');
                if (existingFlowLabel) {
                    existingFlowLabel.remove();
                }

                const segment = this.network.segments[segmentId];
                if (segment) {
                    const fromPoint = this.network.points[segment.fromPointId];
                    const toPoint = this.network.points[segment.toPointId];
                    
                    if (fromPoint && toPoint) {
                        const midX = ((fromPoint.x || 50) + (toPoint.x || 50)) / 2;
                        const midY = ((fromPoint.y || 50) + (toPoint.y || 50)) / 2;
                        
                        const flowLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        flowLabel.setAttribute('x', midX);
                        flowLabel.setAttribute('y', midY + 15);
                        flowLabel.setAttribute('class', 'flow-label');
                        flowLabel.textContent = `${flow.toFixed(1)}`;
                        
                        segmentGroup.appendChild(flowLabel);
                    }
                }
            }
        });

        // Show pressures on points
        if (result.pointPressures) {
            Object.entries(result.pointPressures).forEach(([pointId, pressure]) => {
                const pointGroup = document.querySelector(`[data-id="${pointId}"]`);
                if (pointGroup) {
                    const existingPressureLabel = pointGroup.querySelector('.pressure-label');
                    if (existingPressureLabel) {
                        existingPressureLabel.remove();
                    }

                    const point = this.network.points[pointId];
                    if (point) {
                        const pressureLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        pressureLabel.setAttribute('x', point.x || 50);
                        pressureLabel.setAttribute('y', (point.y || 50) + this.getPointRadius(point.type) + 45);
                        pressureLabel.setAttribute('class', 'pressure-label');
                        pressureLabel.setAttribute('style', 'font-size: 9px; fill: #2980b9; font-weight: bold;');
                        pressureLabel.textContent = `${pressure.toFixed(0)} psia`;
                        
                        pointGroup.appendChild(pressureLabel);
                    }
                }
            });
        }

        // Show infeasible elements
        if (result.status !== 'Optimal' && result.status !== 'Feasible') {
            document.querySelectorAll('.point, .segment').forEach(el => {
                el.classList.add('infeasible');
            });
        }
    }

    clearOptimizationResults() {
        document.querySelectorAll('.optimized, .infeasible').forEach(el => {
            el.classList.remove('optimized', 'infeasible');
        });
        
        document.querySelectorAll('.flow-label, .pressure-label').forEach(el => {
            el.remove();
        });
    }
}

// Initialize the network diagram
document.addEventListener('DOMContentLoaded', () => {
    window.networkDiagram = new NetworkDiagram('networkCanvas');
});