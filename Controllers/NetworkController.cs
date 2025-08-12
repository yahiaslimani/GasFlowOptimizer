using Microsoft.AspNetCore.Mvc;
using GasPipelineOptimization.Models;
using GasPipelineOptimization.Services;
using System.Text.Json;

namespace GasPipelineOptimization.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NetworkController : ControllerBase
    {
        private readonly OptimizationEngine _optimizationEngine;

        public NetworkController()
        {
            _optimizationEngine = new OptimizationEngine();
        }

        [HttpGet("default")]
        public ActionResult<PipelineNetwork> GetDefaultNetwork()
        {
            try
            {
                var network = PipelineNetwork.LoadFromJson("config.json");
                return Ok(network);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error loading network: {ex.Message}");
            }
        }

        [HttpPost("validate")]
        public ActionResult<NetworkValidationResult> ValidateNetwork([FromBody] PipelineNetwork network)
        {
            try
            {
                var isValid = network.IsValid(out List<string> errors);
                return Ok(new NetworkValidationResult
                {
                    IsValid = isValid,
                    Errors = errors
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Validation error: {ex.Message}");
            }
        }

        [HttpPost("optimize")]
        public ActionResult<OptimizationResult> RunOptimization([FromBody] OptimizationRequest request)
        {
            try
            {
                var result = _optimizationEngine.RunOptimization(
                    request.Algorithm, 
                    request.Network, 
                    request.Settings
                );
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Optimization error: {ex.Message}");
            }
        }

        [HttpGet("algorithms")]
        public ActionResult<IEnumerable<AlgorithmInfo>> GetAvailableAlgorithms()
        {
            try
            {
                var algorithms = _optimizationEngine.GetAvailableAlgorithms()
                    .Select(name =>
                    {
                        var algorithm = _optimizationEngine.GetAlgorithm(name);
                        return new AlgorithmInfo
                        {
                            Name = name,
                            Description = algorithm?.Description ?? "No description available"
                        };
                    });
                return Ok(algorithms);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting algorithms: {ex.Message}");
            }
        }

        [HttpPost("points")]
        public ActionResult<Point> CreatePoint([FromBody] Point point)
        {
            try
            {
                // Validate point data
                if (string.IsNullOrEmpty(point.Id) || string.IsNullOrEmpty(point.Name))
                {
                    return BadRequest("Point ID and Name are required");
                }

                return Ok(point);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating point: {ex.Message}");
            }
        }

        [HttpPost("segments")]
        public ActionResult<Segment> CreateSegment([FromBody] Segment segment)
        {
            try
            {
                // Validate segment data
                if (string.IsNullOrEmpty(segment.Id) || 
                    string.IsNullOrEmpty(segment.FromPointId) || 
                    string.IsNullOrEmpty(segment.ToPointId))
                {
                    return BadRequest("Segment ID, FromPointId, and ToPointId are required");
                }

                return Ok(segment);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating segment: {ex.Message}");
            }
        }

        [HttpPost("export")]
        public ActionResult<string> ExportNetwork([FromBody] PipelineNetwork network)
        {
            try
            {
                var json = JsonSerializer.Serialize(network, new JsonSerializerOptions 
                { 
                    WriteIndented = true 
                });
                return Ok(json);
            }
            catch (Exception ex)
            {
                return BadRequest($"Export error: {ex.Message}");
            }
        }

        [HttpPost("import")]
        public ActionResult<PipelineNetwork> ImportNetwork([FromBody] string jsonData)
        {
            try
            {
                var network = JsonSerializer.Deserialize<PipelineNetwork>(jsonData);
                return Ok(network);
            }
            catch (Exception ex)
            {
                return BadRequest($"Import error: {ex.Message}");
            }
        }
    }

    public class NetworkValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class AlgorithmInfo
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }

    public class OptimizationRequest
    {
        public string Algorithm { get; set; } = "";
        public PipelineNetwork Network { get; set; } = new();
        public OptimizationSettings Settings { get; set; } = new();
    }
}