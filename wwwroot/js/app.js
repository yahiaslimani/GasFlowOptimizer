// Main Application Controller
class PipelineApp {
    constructor() {
        this.network = {
            name: "New Network",
            description: "Custom pipeline network",
            points: {},
            segments: {}
        };
        this.selectedElement = null;
        this.currentTool = 'select';
        this.optimizationResult = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNetworkStats();
        this.loadAvailableAlgorithms();
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('loadDefaultBtn').addEventListener('click', () => this.loadDefaultNetwork());
        document.getElementById('importBtn').addEventListener('click', () => this.showImportDialog());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportNetwork());

        // Toolbar
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTool(e.target.closest('.tool-btn').dataset.tool);
            });
        });

        // Optimization
        document.getElementById('runOptimizationBtn').addEventListener('click', () => this.runOptimization());
        document.getElementById('exportResultsBtn').addEventListener('click', () => this.exportResults());
        document.getElementById('importDataBtn').addEventListener('click', () => this.showImportDialog());

        // Point type changes
        document.getElementById('pointType').addEventListener('change', (e) => {
            this.updatePointFormFields(e.target.value);
        });

        // Modal controls
        this.setupModalListeners();

        // File import
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileImport(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    setupModalListeners() {
        // Point modal
        document.getElementById('savePointBtn').addEventListener('click', () => this.savePoint());
        document.getElementById('cancelPointBtn').addEventListener('click', () => this.closeModal('pointModal'));

        // Segment modal
        document.getElementById('saveSegmentBtn').addEventListener('click', () => this.saveSegment());
        document.getElementById('cancelSegmentBtn').addEventListener('click', () => this.closeModal('segmentModal'));

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal on X button
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });

        const canvas = document.getElementById('networkCanvas');
        canvas.className = `network-canvas ${tool === 'select' ? 'selecting' : ''}`;
        
        this.updateStatus(`Tool: ${tool}`);
    }

    async loadDefaultNetwork() {
        try {
            this.updateStatus('Loading default network...');
            const response = await fetch('/api/network/default');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.network = await response.json();
            this.renderNetwork();
            this.updateNetworkStats();
            this.updateStatus('Default network loaded successfully');
        } catch (error) {
            console.error('Error loading default network:', error);
            this.updateStatus('Error loading default network', 'error');
        }
    }

    async loadAvailableAlgorithms() {
        try {
            const response = await fetch('/api/network/algorithms');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const algorithms = await response.json();
            const select = document.getElementById('algorithmSelect');
            select.innerHTML = '';
            
            algorithms.forEach(alg => {
                const option = document.createElement('option');
                option.value = alg.name;
                option.textContent = alg.name.replace(/([A-Z])/g, ' $1').trim();
                option.title = alg.description;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading algorithms:', error);
        }
    }

    renderNetwork() {
        if (window.networkDiagram) {
            window.networkDiagram.render(this.network);
        }
    }

    updateNetworkStats() {
        const pointCount = Object.keys(this.network.points || {}).length;
        const segmentCount = Object.keys(this.network.segments || {}).length;
        document.getElementById('networkStats').textContent = `Points: ${pointCount}, Segments: ${segmentCount}`;
    }

    showPointModal(point = null) {
        const modal = document.getElementById('pointModal');
        const form = document.getElementById('pointForm');
        
        if (point) {
            // Edit existing point
            document.getElementById('pointModalTitle').textContent = 'Edit Point';
            this.populatePointForm(point);
        } else {
            // Create new point
            document.getElementById('pointModalTitle').textContent = 'Create Point';
            form.reset();
            document.getElementById('pointType').value = 'Receipt';
            this.updatePointFormFields('Receipt');
        }
        
        modal.style.display = 'block';
    }

    populatePointForm(point) {
        document.getElementById('pointId').value = point.id || '';
        document.getElementById('pointName').value = point.name || '';
        document.getElementById('pointType').value = point.type || 'Receipt';
        document.getElementById('supplyCapacity').value = point.supplyCapacity || 0;
        document.getElementById('demandRequirement').value = point.demandRequirement || 0;
        document.getElementById('minPressure').value = point.minPressure || 0;
        document.getElementById('maxPressure').value = point.maxPressure || 1000;
        document.getElementById('maxPressureBoost').value = point.maxPressureBoost || 0;
        document.getElementById('fuelConsumptionRate').value = point.fuelConsumptionRate || 0;
        document.getElementById('unitCost').value = point.unitCost || 0;
        
        this.updatePointFormFields(point.type || 'Receipt');
    }

    updatePointFormFields(type) {
        const supplyGroup = document.getElementById('supplyCapacityGroup');
        const demandGroup = document.getElementById('demandRequirementGroup');
        const boostGroup = document.getElementById('maxPressureBoostGroup');
        const fuelGroup = document.getElementById('fuelConsumptionRateGroup');

        // Hide all type-specific fields
        supplyGroup.style.display = 'none';
        demandGroup.style.display = 'none';
        boostGroup.style.display = 'none';
        fuelGroup.style.display = 'none';

        // Show relevant fields based on type
        switch (type) {
            case 'Receipt':
                supplyGroup.style.display = 'block';
                break;
            case 'Delivery':
                demandGroup.style.display = 'block';
                break;
            case 'Compressor':
                boostGroup.style.display = 'block';
                fuelGroup.style.display = 'block';
                break;
        }
    }

    savePoint() {
        const form = document.getElementById('pointForm');
        const formData = new FormData(form);
        
        const point = {
            id: document.getElementById('pointId').value,
            name: document.getElementById('pointName').value,
            type: document.getElementById('pointType').value,
            supplyCapacity: parseFloat(document.getElementById('supplyCapacity').value) || 0,
            demandRequirement: parseFloat(document.getElementById('demandRequirement').value) || 0,
            minPressure: parseFloat(document.getElementById('minPressure').value) || 0,
            maxPressure: parseFloat(document.getElementById('maxPressure').value) || 1000,
            currentPressure: parseFloat(document.getElementById('minPressure').value) || 0,
            maxPressureBoost: parseFloat(document.getElementById('maxPressureBoost').value) || 0,
            fuelConsumptionRate: parseFloat(document.getElementById('fuelConsumptionRate').value) || 0,
            unitCost: parseFloat(document.getElementById('unitCost').value) || 0,
            x: Math.random() * 400 + 50, // Random position for new points
            y: Math.random() * 300 + 50,
            isActive: true
        };

        // Validate required fields
        if (!point.id || !point.name) {
            alert('ID and Name are required');
            return;
        }

        // Check for duplicate IDs
        if (this.network.points[point.id] && this.selectedElement?.id !== point.id) {
            alert('Point ID already exists');
            return;
        }

        this.network.points[point.id] = point;
        this.renderNetwork();
        this.updateNetworkStats();
        this.closeModal('pointModal');
        this.updateStatus(`Point ${point.id} saved`);
    }

    showSegmentModal(segment = null) {
        const modal = document.getElementById('segmentModal');
        const form = document.getElementById('segmentForm');
        
        if (segment) {
            // Edit existing segment
            this.populateSegmentForm(segment);
        } else {
            // Create new segment
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    populateSegmentForm(segment) {
        document.getElementById('segmentId').value = segment.id || '';
        document.getElementById('segmentName').value = segment.name || '';
        document.getElementById('capacity').value = segment.capacity || 0;
        document.getElementById('length').value = segment.length || 0;
        document.getElementById('diameter').value = segment.diameter || 0;
        document.getElementById('transportationCost').value = segment.transportationCost || 0;
        document.getElementById('isBidirectional').checked = segment.isBidirectional || false;
    }

    saveSegment() {
        const segment = {
            id: document.getElementById('segmentId').value,
            name: document.getElementById('segmentName').value,
            fromPointId: this.selectedElement?.fromPointId || '',
            toPointId: this.selectedElement?.toPointId || '',
            capacity: parseFloat(document.getElementById('capacity').value) || 0,
            length: parseFloat(document.getElementById('length').value) || 0,
            diameter: parseFloat(document.getElementById('diameter').value) || 0,
            frictionFactor: 0.012,
            pressureDropConstant: 0.00008,
            transportationCost: parseFloat(document.getElementById('transportationCost').value) || 0,
            currentFlow: 0,
            isActive: true,
            isBidirectional: document.getElementById('isBidirectional').checked,
            minFlow: document.getElementById('isBidirectional').checked ? -parseFloat(document.getElementById('capacity').value) || 0 : 0
        };

        // Validate required fields
        if (!segment.id || !segment.name || !segment.fromPointId || !segment.toPointId) {
            alert('ID, Name, From Point, and To Point are required');
            return;
        }

        // Check for duplicate IDs
        if (this.network.segments[segment.id] && this.selectedElement?.id !== segment.id) {
            alert('Segment ID already exists');
            return;
        }

        this.network.segments[segment.id] = segment;
        this.renderNetwork();
        this.updateNetworkStats();
        this.closeModal('segmentModal');
        this.updateStatus(`Segment ${segment.id} saved`);
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    async runOptimization() {
        try {
            this.updateStatus('Running optimization...', 'info');
            document.getElementById('runOptimizationBtn').innerHTML = '<span class="spinner"></span> Running...';
            document.getElementById('runOptimizationBtn').disabled = true;

            const algorithm = document.getElementById('algorithmSelect').value;
            const settings = {
                enablePressureConstraints: document.getElementById('enablePressureConstraints').checked,
                enableCompressorStations: document.getElementById('enableCompressorStations').checked,
                timeLimit: 300, // 5 minutes
                enableFuelConsumption: true,
                enableCostOptimization: true
            };

            const response = await fetch('/api/network/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    algorithm: algorithm,
                    network: this.network,
                    settings: settings
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.optimizationResult = await response.json();
            this.displayOptimizationResults();
            this.renderOptimizationResults();
            this.updateStatus('Optimization completed successfully', 'success');

        } catch (error) {
            console.error('Optimization error:', error);
            this.updateStatus(`Optimization failed: ${error.message}`, 'error');
        } finally {
            document.getElementById('runOptimizationBtn').innerHTML = '<i class="fas fa-play"></i> Run Optimization';
            document.getElementById('runOptimizationBtn').disabled = false;
        }
    }

    displayOptimizationResults() {
        if (!this.optimizationResult) return;

        const statusDiv = document.getElementById('optimizationStatus');
        const resultsDiv = document.getElementById('resultsContent');

        if (this.optimizationResult.status === 'Optimal' || this.optimizationResult.status === 'Feasible') {
            statusDiv.textContent = `Optimization completed successfully using ${document.getElementById('algorithmSelect').value}`;
            statusDiv.className = 'status-message success';
            
            // Update summary metrics
            document.getElementById('totalCost').textContent = `$${this.optimizationResult.totalCost?.totalCost?.toFixed(2) || 'N/A'}`;
            document.getElementById('totalThroughput').textContent = `${this.optimizationResult.metrics?.totalThroughput?.toFixed(2) || 'N/A'} MMscfd`;
            
            // Update segment flows
            this.updateSegmentFlowsTable();
            
            // Update point pressures
            this.updatePointPressuresTable();
            
            // Update compressor usage
            this.updateCompressorUsageTable();
            
            resultsDiv.style.display = 'block';
        } else {
            let errorMessage = `Optimization ${this.optimizationResult.status}`;
            if (this.optimizationResult.messages && this.optimizationResult.messages.length > 0) {
                errorMessage += `: ${this.optimizationResult.messages.join(', ')}`;
            }
            if (this.optimizationResult.validationErrors && this.optimizationResult.validationErrors.length > 0) {
                errorMessage += `. Validation errors: ${this.optimizationResult.validationErrors.join(', ')}`;
            }
            
            statusDiv.textContent = errorMessage;
            statusDiv.className = 'status-message error';
            resultsDiv.style.display = 'none';
            
            // Highlight problematic elements in the diagram
            this.highlightProblematicElements();
        }
    }

    updateSegmentFlowsTable() {
        const container = document.getElementById('segmentFlows');
        container.innerHTML = '';

        if (this.optimizationResult.segmentFlows) {
            Object.entries(this.optimizationResult.segmentFlows).forEach(([segmentId, flow]) => {
                const row = document.createElement('div');
                row.className = 'row';
                row.innerHTML = `
                    <span>${segmentId}:</span>
                    <span>${flow.toFixed(2)} MMscfd</span>
                `;
                container.appendChild(row);
            });
        }
    }

    updatePointPressuresTable() {
        const container = document.getElementById('pointPressures');
        container.innerHTML = '';

        if (this.optimizationResult.pointPressures) {
            Object.entries(this.optimizationResult.pointPressures).forEach(([pointId, pressure]) => {
                const row = document.createElement('div');
                row.className = 'row';
                row.innerHTML = `
                    <span>${pointId}:</span>
                    <span>${pressure.toFixed(1)} psia</span>
                `;
                container.appendChild(row);
            });
        }
    }

    updateCompressorUsageTable() {
        const container = document.getElementById('compressorUsage');
        container.innerHTML = '';

        if (this.optimizationResult.compressorUsage) {
            Object.entries(this.optimizationResult.compressorUsage).forEach(([pointId, boost]) => {
                const row = document.createElement('div');
                row.className = 'row';
                row.innerHTML = `
                    <span>${pointId}:</span>
                    <span>${boost.toFixed(1)} psi</span>
                `;
                container.appendChild(row);
            });
        }
    }

    renderOptimizationResults() {
        if (window.networkDiagram) {
            window.networkDiagram.showOptimizationResults(this.optimizationResult);
        }
    }

    highlightProblematicElements() {
        // Clear previous optimization results
        if (window.networkDiagram) {
            window.networkDiagram.clearOptimizationResults();
            
            // Only highlight specific infeasible segments if available in optimization result
            if (this.optimizationResult.infeasibleSegments && this.optimizationResult.infeasibleSegments.length > 0) {
                this.optimizationResult.infeasibleSegments.forEach(segmentId => {
                    const segmentElement = document.querySelector(`[data-id="${segmentId}"]`);
                    if (segmentElement) {
                        segmentElement.classList.add('infeasible');
                    }
                });
            } else if (this.optimizationResult.validationErrors && this.optimizationResult.validationErrors.length > 0) {
                // Extract segment IDs from validation error messages and highlight them
                this.optimizationResult.validationErrors.forEach(error => {
                    const segmentMatch = error.match(/segment\s+(\w+)/i);
                    if (segmentMatch) {
                        const segmentId = segmentMatch[1];
                        const segmentElement = document.querySelector(`[data-id="${segmentId}"]`);
                        if (segmentElement) {
                            segmentElement.classList.add('infeasible');
                        }
                    }
                });
            } else {
                // Generic failure - highlight all segments with reduced opacity
                document.querySelectorAll('.segment').forEach(el => {
                    el.classList.add('optimization-failed');
                });
            }
        }
    }

    showImportDialog() {
        document.getElementById('fileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                this.network = jsonData;
                this.renderNetwork();
                this.updateNetworkStats();
                this.updateStatus('Network imported successfully', 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.updateStatus('Error importing network: Invalid JSON', 'error');
            }
        };
        reader.readAsText(file);
    }

    exportNetwork() {
        try {
            const dataStr = JSON.stringify(this.network, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.network.name.replace(/\s+/g, '_')}_network.json`;
            link.click();
            
            this.updateStatus('Network exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.updateStatus('Error exporting network', 'error');
        }
    }

    exportResults() {
        if (!this.optimizationResult) {
            alert('No optimization results to export');
            return;
        }

        try {
            const dataStr = JSON.stringify(this.optimizationResult, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `optimization_results_${new Date().toISOString().slice(0,10)}.json`;
            link.click();
            
            this.updateStatus('Results exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.updateStatus('Error exporting results', 'error');
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Delete' && this.selectedElement) {
            this.deleteSelectedElement();
        } else if (event.key === 'Escape') {
            this.selectedElement = null;
            if (window.networkDiagram) {
                window.networkDiagram.clearSelection();
            }
        }
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;

        const confirmed = confirm(`Are you sure you want to delete ${this.selectedElement.type} ${this.selectedElement.id}?`);
        if (!confirmed) return;

        if (this.selectedElement.type === 'point') {
            // Remove the point
            delete this.network.points[this.selectedElement.id];
            
            // Remove all segments connected to this point
            Object.keys(this.network.segments).forEach(segmentId => {
                const segment = this.network.segments[segmentId];
                if (segment.fromPointId === this.selectedElement.id || segment.toPointId === this.selectedElement.id) {
                    delete this.network.segments[segmentId];
                }
            });
        } else if (this.selectedElement.type === 'segment') {
            delete this.network.segments[this.selectedElement.id];
        }

        this.selectedElement = null;
        this.renderNetwork();
        this.updateNetworkStats();
        this.updateStatus('Element deleted');
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update button states
        document.querySelectorAll('.toolbar .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (tool !== 'select') {
            const activeBtn = document.querySelector(`[onclick*="${tool}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        } else {
            document.getElementById('selectTool').classList.add('active');
        }
        
        // Clear any ongoing connection
        if (window.networkDiagram && window.networkDiagram.connectingFrom) {
            window.networkDiagram.highlightPoint(window.networkDiagram.connectingFrom.id, false);
            window.networkDiagram.connectingFrom = null;
        }
        
        this.updateStatus(`Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusText');
        statusElement.textContent = message;
        
        // Remove existing status classes
        statusElement.classList.remove('success', 'error', 'info');
        if (type !== 'info') {
            statusElement.classList.add(type);
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PipelineApp();
});