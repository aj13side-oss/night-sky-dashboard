import { getWeatherConditions } from "@/lib/astronomy";
import { Cloud, Droplets, Wind, Thermometer, Eye, Gauge } from "lucide-react";
import { motion } from "framer-motion";

const WeatherCard = () => {
  const weather = getWeatherConditions();

  const qualityColor = (val: string) => {
    if (val === "Excellent") return "text-green-400";
    if (val === "Good") return "text-primary";
    return "text-muted-foreground";
  };

  const items = [
    { icon: Thermometer, label: "Temperature", value: `${weather.temperature}°C` },
    { icon: Cloud, label: "Cloud Cover", value: `${weather.cloudCover}%` },
    { icon: Droplets, label: "Humidity", value: `${weather.humidity}%` },
    { icon: Wind, label: "Wind", value: `${weather.windSpeed} km/h` },
    { icon: Eye, label: "Transparency", value: weather.transparency, special: true },
    { icon: Gauge, label: "Seeing", value: weather.seeing, special: true },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conditions</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Good night</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2"
          >
            <item.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <p className={`text-sm font-medium ${item.special ? qualityColor(item.value) : 'text-foreground'}`}>
                {item.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-3 border-t border-border flex justify-between text-xs">
        <span className="text-muted-foreground">Bortle {weather.bortleScale}</span>
        <span className="text-muted-foreground">SQM {weather.sqm}</span>
        <span className="text-muted-foreground">Dew {weather.dewPoint}°C</span>
      </div>
    </div>
  );
};

export default WeatherCard;
