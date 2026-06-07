import Chart from "chart.js/auto";

export interface ChartDataPoint {
  label: string;
  data: {
    x: number;
    [key: string]: number;
  };
}

export class SimulationChart {
  private chart: Chart;
  private maxPoints: number;
  private datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string }[];

  constructor(canvasId: string, datasets: { label: string; color: string }[], maxPoints: number = 200) {
    this.maxPoints = maxPoints;
    this.datasets = datasets.map(d => ({
      label: d.label,
      data: [],
      borderColor: d.color,
      backgroundColor: d.color + "33",
    }));

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: [],
        datasets: this.datasets.map(d => ({
          label: d.label,
          data: d.data,
          borderColor: d.borderColor,
          backgroundColor: d.backgroundColor,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.3,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        plugins: {
          legend: {
            labels: {
              color: "#a0a0c0",
              font: { size: 10 },
              boxWidth: 12,
            },
          },
        },
        scales: {
          x: {
            display: true,
            ticks: { color: "#666", maxTicksLimit: 5, font: { size: 9 } },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          y: {
            display: true,
            ticks: { color: "#666", font: { size: 9 } },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },
      },
    });
  }

  addDataPoint(label: string, values: number[]): void {
    this.chart.data.labels!.push(label);
    this.datasets.forEach((d, i) => {
      d.data.push(values[i] ?? 0);
      if (d.data.length > this.maxPoints) d.data.shift();
    });
    (this.chart.data.datasets as Array<{ data: number[] }>).forEach((ds, i) => {
      ds.data = this.datasets[i].data;
    });
    if (this.chart.data.labels!.length > this.maxPoints) {
      this.chart.data.labels!.shift();
    }
    this.chart.update();
  }

  reset(): void {
    this.chart.data.labels = [];
    this.datasets.forEach(d => d.data = []);
    (this.chart.data.datasets as Array<{ data: number[] }>).forEach((ds, i) => {
      ds.data = this.datasets[i].data;
    });
    this.chart.update();
  }

  destroy(): void {
    this.chart.destroy();
  }
}