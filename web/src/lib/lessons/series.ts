// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isLessonSeriesActive(series: any): boolean {
  if (typeof series?.is_active === 'boolean') {
    return series.is_active;
  }

  if (typeof series?.active === 'boolean') {
    return series.active;
  }

  // Se não tem campo de status, considera ativa se não está deletada
  if (series?.deleted_at) {
    return false;
  }

  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNextLessonOrderInSeries(lessons: any[] | null | undefined): number {
  const highestOrder = (lessons ?? []).reduce((maxOrder, lesson) => {
    if (lesson?.deleted_at) {
      return maxOrder;
    }

    const order = typeof lesson?.order_in_series === 'number' ? lesson.order_in_series : 0;
    return Math.max(maxOrder, order);
  }, 0);

  return highestOrder + 1;
}
