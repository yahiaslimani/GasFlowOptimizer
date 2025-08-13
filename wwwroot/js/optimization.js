// Optimization module for handling optimization requests and results
class OptimizationManager {
    constructor() {
        this.isRunning = false;
        this.currentResult = null;
        this.algorithms = [];
    }

    async loadAlgorithms() {
        try {
            const response = await fetch('/api/network/algorithms');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.algorithms = await response.json();
            return this.algorithms;
        } catch (error) {
            console.error('Error loading algorithms:', error);
            return [];
        }
    }

    async validateNetwork(network) {
        try {
            const response = await fetch('/api/network/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(network)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error validating network:', error);
            return { isValid: false, errors: ['Validation request failed'] };
        }
    }

    async runOptimization(algorithm, network, settings) {
        if (this.isRunning) {
            throw new Error('Optimization is already running');
        }

        this.isRunning = true;
        
        try {
            // First validate the network
            const validation = await this.validateNetwork(network);
            if (!validation.isValid) {
                throw new Error(`Network validation failed: ${validation.errors.join(', ')}`);
            }

            const response = await fetch('/api/network/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    algorithm: algorithm,
                    network: network,
                    settings: settings
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Optimization failed: ${errorText}`);
            }

            this.currentResult = await response.json();
            return this.currentResult;

        } catch (error) {
            console.error('Optimization error:', error);
            // Create a failed result object
            this.currentResult = {
                status: 'Failed',
                messages: [error.message],
                segmentFlows: {},
                pointPressures: {},
                totalCost: { totalCost: 0 },
                metrics: { totalThroughput: 0, solutionTimeMs: 0, averageCapacityUtilization: 0 },
                isValid: false,
                validationErrors: [error.message]
            };
            return this.currentResult;
        } finally {
            this.isRunning = false;
        }
    }

    generateOptimizationSettings() {
        return {
            enablePressureConstraints: document.getElementById('enablePressureConstraints')?.checked || true,
            enableCompressorStations: document.getElementById('enableCompressorStations')?.checked || true,
            timeLimit: 300, // 5 minutes
            enableFuelConsumption: true,
            enableCostOptimization: true,
            objectiveFunction: document.getElementById('objectiveSelect')?.value || 'MaximizeThroughput'
        };
    }

    formatOptimizationResult(result) {
        if (!result) return null;

        return {
            status: result.status,
            summary: {
                totalCost: result.totalCost?.totalCost || 0,
                totalThroughput: result.metrics?.totalThroughput || 0,
                solutionTime: result.metrics?.solutionTimeMs || 0,
                utilization: result.metrics?.averageCapacityUtilization || 0
            },
            details: {
                segmentFlows: result.segmentFlows || {},
                pointPressures: result.pointPressures || {},
                compressorUsage: result.compressorUsage || {}
            },
            validation: {
                isValid: result.isValid || false,
                errors: result.validationErrors || []
            }
        };
    }

    generateReport(result) {
        if (!result) return '';

        const formatted = this.formatOptimizationResult(result);
        
        let report = `
=== Gas Pipeline Optimization Report ===
Generated: ${new Date().toLocaleString()}

OPTIMIZATION SUMMARY:
Status: ${formatted.status}
Total Cost: $${formatted.summary.totalCost.toFixed(2)}
Total Throughput: ${formatted.summary.totalThroughput.toFixed(2)} MMscfd
Solution Time: ${formatted.summary.solutionTime.toFixed(0)} ms
Average Utilization: ${formatted.summary.utilization.toFixed(1)}%

SEGMENT FLOWS:
`;

        Object.entries(formatted.details.segmentFlows).forEach(([segmentId, flow]) => {
            report += `${segmentId}: ${flow.toFixed(2)} MMscfd\n`;
        });

        report += `\nPOINT PRESSURES:\n`;
        Object.entries(formatted.details.pointPressures).forEach(([pointId, pressure]) => {
            report += `${pointId}: ${pressure.toFixed(1)} psia\n`;
        });

        if (Object.keys(formatted.details.compressorUsage).length > 0) {
            report += `\nCOMPRESSOR USAGE:\n`;
            Object.entries(formatted.details.compressorUsage).forEach(([pointId, boost]) => {
                report += `${pointId}: ${boost.toFixed(1)} psi boost\n`;
            });
        }

        if (!formatted.validation.isValid && formatted.validation.errors.length > 0) {
            report += `\nVALIDATION ERRORS:\n`;
            formatted.validation.errors.forEach(error => {
                report += `- ${error}\n`;
            });
        }

        return report;
    }

    exportResults(filename = null) {
        if (!this.currentResult) {
            throw new Error('No optimization results to export');
        }

        const report = this.generateReport(this.currentResult);
        const blob = new Blob([report], { type: 'text/plain' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || `optimization_results_${new Date().toISOString().slice(0,10)}.txt`;
        link.click();
    }

    clearResults() {
        this.currentResult = null;
        
        // Clear visualization
        if (window.networkDiagram) {
            window.networkDiagram.clearOptimizationResults();
        }

        // Clear UI
        const statusDiv = document.getElementById('optimizationStatus');
        const resultsDiv = document.getElementById('resultsContent');
        
        if (statusDiv) {
            statusDiv.textContent = 'Ready to run optimization';
            statusDiv.className = 'status-message';
        }
        
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
    }

    getOptimizationHistory() {
        // This could be implemented to store and retrieve previous optimization runs
        return [];
    }

    compareOptimizations(results) {
        if (!Array.isArray(results) || results.length < 2) {
            throw new Error('Need at least 2 results to compare');
        }

        const comparison = {
            algorithms: results.map(r => r.algorithm || 'Unknown'),
            metrics: {
                totalCosts: results.map(r => r.totalCost?.totalCost || 0),
                totalThroughputs: results.map(r => r.metrics?.totalThroughput || 0),
                solutionTimes: results.map(r => r.metrics?.solutionTimeMs || 0),
                utilizations: results.map(r => r.metrics?.averageCapacityUtilization || 0)
            }
        };

        // Find best performing algorithm for each metric
        comparison.best = {
            cost: comparison.algorithms[comparison.metrics.totalCosts.indexOf(Math.min(...comparison.metrics.totalCosts))],
            throughput: comparison.algorithms[comparison.metrics.totalThroughputs.indexOf(Math.max(...comparison.metrics.totalThroughputs))],
            time: comparison.algorithms[comparison.metrics.solutionTimes.indexOf(Math.min(...comparison.metrics.solutionTimes))],
            utilization: comparison.algorithms[comparison.metrics.utilizations.indexOf(Math.max(...comparison.metrics.utilizations))]
        };

        return comparison;
    }

    async runMultipleOptimizations(network, algorithms = null) {
        if (!algorithms) {
            algorithms = this.algorithms.map(a => a.name);
        }

        const settings = this.generateOptimizationSettings();
        const results = [];

        for (const algorithm of algorithms) {
            try {
                console.log(`Running optimization with ${algorithm}...`);
                const result = await this.runOptimization(algorithm, network, settings);
                results.push({ algorithm, ...result });
            } catch (error) {
                console.error(`Failed to run ${algorithm}:`, error);
                results.push({ 
                    algorithm, 
                    status: 'Failed', 
                    error: error.message 
                });
            }
        }

        return results;
    }

    getAlgorithmRecommendation(network) {
        const pointCount = Object.keys(network.points || {}).length;
        const segmentCount = Object.keys(network.segments || {}).length;
        const hasCompressors = Object.values(network.points || {}).some(p => p.type === 'Compressor');
        
        let recommendation = {
            algorithm: 'MaximizeThroughput',
            reason: 'Default choice for general optimization'
        };

        if (pointCount > 20 || segmentCount > 30) {
            recommendation = {
                algorithm: 'MinimizeCost',
                reason: 'Large network - cost optimization typically performs better'
            };
        } else if (hasCompressors) {
            recommendation = {
                algorithm: 'BalanceDemand',
                reason: 'Network has compressors - balancing can improve efficiency'
            };
        }

        return recommendation;
    }

    estimateOptimizationTime(network, algorithm) {
        const pointCount = Object.keys(network.points || {}).length;
        const segmentCount = Object.keys(network.segments || {}).length;
        const complexity = pointCount + segmentCount * 2;
        
        let baseTime = 5; // seconds
        
        if (complexity > 50) baseTime *= 2;
        if (complexity > 100) baseTime *= 3;
        
        // Algorithm-specific adjustments
        switch (algorithm) {
            case 'MinimizeCost':
                baseTime *= 1.5;
                break;
            case 'BalanceDemand':
                baseTime *= 1.2;
                break;
        }

        return baseTime;
    }
}

// Initialize optimization manager
document.addEventListener('DOMContentLoaded', () => {
    window.optimizationManager = new OptimizationManager();
    window.optimizationManager.loadAlgorithms();
});