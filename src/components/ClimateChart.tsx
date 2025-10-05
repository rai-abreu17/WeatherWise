import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ClimateChartProps {
  analysisData: any;
}

const ClimateChart: React.FC<ClimateChartProps> = ({ analysisData }) => {
  if (!analysisData) {
    return null;
  }

  const chartData = [
    { name: 'Data Solicitada', ...analysisData.requestedDate },
    ...analysisData.alternativeDates.map((date: any, index: number) => ({ name: `Alternativa ${index + 1}`, ...date }))
  ];

  return (
    <Card className="glass-effect-strong p-6 rounded-2xl animate-slide-up">
      <CardHeader>
        <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
          Comparativo de Métricas Climáticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--primary))' }} />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" label={{ value: 'Chuva (%)', angle: 90, position: 'insideRight', fill: 'hsl(var(--accent))' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} name="Temperatura Média (°C)" />
            <Line yAxisId="right" type="monotone" dataKey="rainProbability" stroke="hsl(var(--accent))" activeDot={{ r: 8 }} name="Probabilidade de Chuva (%)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ClimateChart;
