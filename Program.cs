using GasPipelineOptimization.Models;
using GasPipelineOptimization.Services;
using System.Text.Json;

namespace GasPipelineOptimization
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Always run in web mode by default
            Console.WriteLine("=== Gas Pipeline Optimization Web Application ===");
            Console.WriteLine("Starting web server...");
            
            var builder = WebApplication.CreateBuilder(args);
            
            // Configure services
            builder.Services.AddControllers();
            builder.Services.AddSingleton<OptimizationEngine>();
            
            // Enable CORS for development
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            var app = builder.Build();

            // Configure pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();
            app.UseCors();
            
            // Serve static files from wwwroot
            app.UseStaticFiles();
            app.UseDefaultFiles();

            app.MapControllers();
            app.MapFallbackToFile("index.html");

            // Ensure we bind to all interfaces
            var urls = "http://0.0.0.0:5000";
            app.Urls.Add(urls);

            Console.WriteLine($"Web application started at: {urls}");
            Console.WriteLine("Access the interactive interface in your browser");
            
            await app.RunAsync();
        }

        static PipelineNetwork LoadDefaultNetwork()
        {
            try
            {
                return PipelineNetwork.LoadFromJson("config.json");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading default network: {ex.Message}");
                return CreateSampleNetwork();
            }
        }

        static PipelineNetwork CreateSampleNetwork()
        {
            var network = new PipelineNetwork
            {
                Name = "Sample Network",
                Description = "Sample pipeline network for testing",
                Points = new Dictionary<string, Point>(),
                Segments = new Dictionary<string, Segment>()
            };

            // Add sample points
            network.Points.Add("R1", new Point
            {
                Id = "R1",
                Name = "Receipt Point 1",
                Type = PointType.Receipt,
                SupplyCapacity = 1000,
                MinPressure = 900,
                MaxPressure = 1000,
                CurrentPressure = 950,
                UnitCost = 2.5,
                X = 50,
                Y = 50,
                IsActive = true
            });

            network.Points.Add("D1", new Point
            {
                Id = "D1",
                Name = "Delivery Point 1",
                Type = PointType.Delivery,
                DemandRequirement = 500,
                MinPressure = 400,
                MaxPressure = 600,
                CurrentPressure = 500,
                X = 200,
                Y = 100,
                IsActive = true
            });

            // Add sample segment
            network.Segments.Add("S1", new Segment
            {
                Id = "S1",
                Name = "Main Line",
                FromPointId = "R1",
                ToPointId = "D1",
                Capacity = 800,
                Length = 100,
                Diameter = 24,
                TransportationCost = 0.1,
                IsActive = true
            });

            return network;
        }
    }
}