export function useDashboardChartTheme() {
  const colors = {
    primary: '#2C4A6E',
    primaryLight: '#4A6B8A',
    success: '#3D7A6A',
    danger: '#B54A4A',
    warning: '#A67C52',
    pink: '#9E5B6B',
    orange: '#A67C52',
    purple: '#7D6B8F',
    teal: '#3D728A',
    navy: '#1C1917',
    muted: '#A8A29E',
  }

  const baseOptions = {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 600 },
    },
    grid: {
      borderColor: 'rgba(168, 162, 158, 0.18)',
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    xaxis: {
      labels: {
        style: { colors: colors.muted, fontSize: '11px', fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: colors.muted, fontSize: '11px', fontWeight: 500 },
      },
    },
    legend: {
      fontSize: '12px',
      fontWeight: 600,
      labels: { colors: colors.navy },
      markers: { size: 6, strokeWidth: 0, offsetX: -2 },
    },
    tooltip: {
      theme: 'light',
      style: { fontSize: '12px' },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 3 },
  }

  function lineOptions(categories: string[], seriesColors: string[] = [colors.primary, colors.pink, colors.success]) {
    return {
      ...baseOptions,
      colors: seriesColors,
      xaxis: { ...baseOptions.xaxis, categories },
      stroke: { curve: 'smooth' as const, width: 3 },
    }
  }

  function areaOptions(categories: string[], seriesColors: string[] = [colors.primary, colors.teal]) {
    return {
      ...lineOptions(categories, seriesColors),
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.4,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
    }
  }

  function barOptions(categories: string[], seriesColors: string[] = [colors.primary, colors.success]) {
    return {
      ...baseOptions,
      colors: seriesColors,
      xaxis: { ...baseOptions.xaxis, categories },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '42%',
        },
      },
      stroke: { show: false },
    }
  }

  function donutOptions(labels: string[], seriesColors: string[]) {
    return {
      ...baseOptions,
      colors: seriesColors,
      labels,
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: '',
                fontSize: '14px',
                fontWeight: 700,
                color: colors.navy,
              },
            },
          },
        },
      },
      stroke: { width: 0 },
    }
  }

  return { colors, lineOptions, areaOptions, barOptions, donutOptions }
}
