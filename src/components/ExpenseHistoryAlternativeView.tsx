import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
// Import styling
import './ExpenseHistoryChart.css';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ExpenseHistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyData: { month: string; total: number }[];
  getCategorySpending: (monthIndex: number) => { category: string; value: number; color: string }[];
  formatAmount: (amount: number) => string;
  transactions?: Array<{
    id: number;
    name: string;
    amount: number;
    date: string;
    category: string;
    isIncoming: boolean;
    description?: string;
    displayDate?: string;
  }>;
}

interface TransactionDetails {
  category: string;
  amount: number;
  count: number;
}

const ExpenseHistoryAlternativeView: React.FC<ExpenseHistoryPopupProps> = ({
  isOpen,
  onClose,
  monthlyData,
  getCategorySpending,
  formatAmount,
  transactions = [],
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'categories' | 'details'>('trends');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [expandedMonths, setExpandedMonths] = useState<{ [key: number]: boolean }>({});
  // Add pagination state for transaction details
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset pagination when changing category or month
  useEffect(() => {
    if (selectedCategory !== null && selectedMonth !== null) {
      setCurrentPage(1);
    }
  }, [selectedCategory, selectedMonth]);

  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    // Store ref value in a variable to use in cleanup
    const currentContentRef = contentRef.current;

    const handleScroll = () => {
      if (currentContentRef) {
        setShowScrollTop(currentContentRef.scrollTop > 300);
      }
    };

    currentContentRef.addEventListener('scroll', handleScroll);
    return () => {
      if (currentContentRef) {
        currentContentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen]);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset selections when popup is opened or closed
  useEffect(() => {
    if (isOpen) {
      setActiveTab('trends');
      setSelectedMonth(null);
      setSelectedCategory(null);
    } else {
      // Reset expanded months when popup is closed
      setExpandedMonths({});
    }
  }, [isOpen]);

  // Effect to add pulse animation to the latest data point
  useEffect(() => {
    if (activeTab === 'trends') {
      setTimeout(() => {
        const chartCanvas = document.querySelector('.area-chart-container canvas') as HTMLCanvasElement;
        if (chartCanvas) {
          const chart = ChartJS.getChart(chartCanvas);
          if (chart && chart.data.labels?.length) {
            // Get the last point (most recent month)
            const lastPointIndex = chart.data.labels.length - 1;
            const datasetMeta = chart.getDatasetMeta(0);

            if (datasetMeta.data[lastPointIndex]) {
              // Highlight the last point with a glowing effect and larger radius
              datasetMeta.data[lastPointIndex].options = {
                ...datasetMeta.data[lastPointIndex].options,
                radius: 7,
                borderWidth: 3,
                hoverRadius: 10,
                backgroundColor: '#00BF63',
                borderColor: '#fff',
              };
              chart.update();
            }
          }
        }
      }, 600);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Process monthly data
  const sixMonthsData = [...monthlyData];

  // Process category amounts
  const getCategoryAmounts = (monthIndex: number): TransactionDetails[] => {
    const categoryData = getCategorySpending(monthIndex);
    const monthTotal = sixMonthsData[monthIndex].total;

    return categoryData.map(item => ({
      category: item.category,
      amount: (item.value / 100) * monthTotal,
      count: Math.max(1, Math.round(item.value / 10))
    }));
  };

  // Get transactions for a specific category and month
  const getCategoryTransactions = (monthIndex: number, category: string) => {
    return transactions.filter(t =>
      t.category.toLowerCase() === category.toLowerCase() &&
      new Date(t.date).getMonth() === new Date().getMonth() - (5 - monthIndex)
    );
  };

  // Calculate month-to-month percentage changes
  const getMonthlyChanges = () => {
    const changes = sixMonthsData.map((month, index) => {
      if (index === 0) return { value: 0, isIncrease: false };

      const prevMonth = sixMonthsData[index - 1].total;
      const currentMonth = month.total;
      const percentChange = prevMonth > 0
        ? ((currentMonth - prevMonth) / prevMonth) * 100
        : 0;

      return {
        value: Math.abs(percentChange).toFixed(1),
        isIncrease: percentChange >= 0
      };
    });
    return changes;
  };

  // Generate trend data for line chart
  const getTrendData = () => {
    const ctx = document.createElement('canvas').getContext('2d');
    let gradient = null;
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(0, 191, 99, 0.5)');
      gradient.addColorStop(0.6, 'rgba(0, 191, 99, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 191, 99, 0.02)');
    }

    const monthlyChanges = getMonthlyChanges();

    return {
      labels: sixMonthsData.map(data => data.month),
      datasets: [
        {
          label: 'Monthly Expenses',
          data: sixMonthsData.map(data => data.total),
          borderColor: '#00BF63',
          borderWidth: 2,
          backgroundColor: gradient || 'rgba(0, 191, 99, 0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#00BF63',
          pointBorderColor: '#111',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#00BF63',
          pointHoverBorderWidth: 3,
          // Custom data for tooltips
          monthlyChanges: monthlyChanges
        }
      ]
    };
  };

  // Chart options for trend chart
  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 17, 17, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: function (context: any) {
            return context[0].label;
          },
          label: function (context: any) {
            const totalAmount = `₹${formatAmount(context.parsed.y)}`;
            return totalAmount;
          },
          afterLabel: function (context: any) {
            const datasetIndex = context.datasetIndex;
            const index = context.dataIndex;
            const dataset = context.chart.data.datasets[datasetIndex];

            if (index === 0 || !dataset.monthlyChanges) return '';

            const change = dataset.monthlyChanges[index];
            const changeText = change.isIncrease
              ? `↑ ${change.value}% from previous month`
              : `↓ ${change.value}% from previous month`;

            return changeText;
          },
          labelTextColor: function (context: any) {
            const datasetIndex = context.datasetIndex;
            const index = context.dataIndex;
            const dataset = context.chart.data.datasets[datasetIndex];

            if (index === 0 || !dataset.monthlyChanges) return '#fff';

            return dataset.monthlyChanges[index].isIncrease ? '#f87171' : '#4ade80';
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
      delay: (context: { dataIndex: number; datasetIndex: number }) => context.dataIndex * 100 + context.datasetIndex * 100
    },
    elements: {
      line: {
        borderWidth: 2,
        borderJoinStyle: 'round' as const,
        capBezierPoints: true
      },
      point: {
        hitRadius: 10,
        hoverRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
          tickLength: 8,
          display: true,
          drawOnChartArea: true,
          drawTicks: false,
          offset: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          padding: 10,
          maxRotation: 0
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
          lineWidth: 0.5,
          drawTicks: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          padding: 10,
          callback: function (value: any) {
            return '₹' + formatAmount(value);
          },
          count: 5
        },
        beginAtZero: true
      }
    }
  };

  // Category distribution for selected month
  const getCategoryDistribution = (monthIndex: number) => {
    const categories = getCategorySpending(monthIndex);

    // Format for horizontal bar chart
    return {
      labels: categories.map(cat => cat.category),
      datasets: [
        {
          label: 'Percentage',
          data: categories.map(cat => cat.value),
          backgroundColor: categories.map(cat => cat.color),
          borderRadius: 4
        }
      ]
    };
  };

  // Chart options for horizontal bar chart
  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#111',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.x}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#888',
          callback: function (value: any) {
            return value + '%';
          }
        },
        max: 100
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#888',
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Render transaction details
  const renderTransactionDetails = () => {
    if (selectedMonth === null || selectedCategory === null) {
      return (
        <div className="text-center p-8 bg-neutral-900 rounded-lg mt-4">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No Category Selected</h3>
          <p className="text-gray-400">Select a category from the Categories tab to view detailed transactions.</p>
          <button
            onClick={() => setActiveTab('categories')}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
          >
            Go to Categories
          </button>
        </div>
      );
    }

    const allTransactions = getCategoryTransactions(selectedMonth, selectedCategory);

    if (allTransactions.length === 0) {
      return (
        <div className="bg-neutral-900 rounded-lg p-6 mt-4">
          <h3 className="text-xl font-medium text-white mb-2">
            {selectedCategory} in {sixMonthsData[selectedMonth].month}
          </h3>
          <p className="text-gray-400 mb-6">No transactions recorded for this category this month.</p>

          <div className="border border-dashed border-gray-700 rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500">No transaction data available</p>
          </div>
        </div>
      );
    }

    const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransaction = totalAmount / allTransactions.length;

    // Calculate pagination
    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = allTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
    const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);

    // Pagination control handlers
    // Helpers removed as JSX uses inline state setters directly to avoid lint warnings
    // const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    // const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    // const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    return (
      <div className="bg-neutral-900 rounded-lg p-6 mt-4">
        <div className="flex items-center mb-2">
          <button
            onClick={() => setActiveTab('categories')}
            className="text-gray-400 hover:text-white mr-2 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </button>
        </div>
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
          <div>
            <h3 className="text-xl font-medium text-white mb-1">
              {selectedCategory} in {sixMonthsData[selectedMonth].month}
            </h3>
            <p className="text-gray-400">Detailed breakdown of your spending in this category</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-emerald-500">₹{formatAmount(totalAmount)}</div>
            <div className="text-sm text-gray-400">
              {allTransactions.length} transactions · Avg: ₹{formatAmount(avgTransaction)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-800">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {currentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-800 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{t.displayDate}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{t.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{t.description || '-'}</td>
                  <td className="px-4 py-3 text-right text-base font-medium text-emerald-500">₹{formatAmount(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transaction visualization bar chart */}
        <div className="mt-6 bg-neutral-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Transaction Distribution</div>
          <div className="space-y-2">
            {allTransactions.map(t => (
              <div key={t.id} className="flex flex-col">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-300 truncate max-w-[200px]">{t.name}</span>
                  <span className="text-emerald-500 text-sm">₹{formatAmount(t.amount)}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(t.amount / Math.max(...allTransactions.map(tx => tx.amount))) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Highest Transaction</div>
            <div className="text-white text-lg font-medium">
              ₹{formatAmount(Math.max(...allTransactions.map(t => t.amount)))}
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lowest Transaction</div>
            <div className="text-white text-lg font-medium">
              ₹{formatAmount(Math.min(...allTransactions.map(t => t.amount)))}
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">% of Monthly Total</div>
            <div className="text-white text-lg font-medium">
              {((totalAmount / sixMonthsData[selectedMonth].total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-3 bg-neutral-800 rounded-lg">
            <div className="text-gray-400 text-sm mb-2 sm:mb-0">
              Showing {indexOfFirstTransaction + 1} - {Math.min(indexOfLastTransaction, allTransactions.length)} of {allTransactions.length} transactions
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className={`p-2 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-700'}`}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page number buttons - show limited number of pages for better UI */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // For more than 5 pages, show first, last, and pages around current
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                  if (i === 4) pageNum = totalPages;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                  if (i === 0) pageNum = 1;
                } else {
                  pageNum = currentPage - 2 + i;
                  if (i === 0) pageNum = 1;
                  if (i === 4) pageNum = totalPages;
                }

                return (
                  <button
                    key={i}
                    type="button"
                    className={`w-8 h-8 rounded-full text-sm font-medium ${currentPage === pageNum
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:bg-neutral-700'
                      }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className={`p-2 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-700'}`}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-11/12 h-[90vh] max-w-7xl bg-black rounded-2xl shadow-2xl flex flex-col border border-neutral-800 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-2xl font-bold text-white">6-Month Expense History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors focus:outline-none"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800">
          <button
            className={`px-6 py-4 font-medium transition-colors focus:outline-none ${activeTab === 'trends'
                ? 'text-emerald-500 border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-white'
              }`}
            onClick={() => setActiveTab('trends')}
          >
            Spending Trends
          </button>
          <button
            className={`px-6 py-4 font-medium transition-colors focus:outline-none ${activeTab === 'categories'
                ? 'text-emerald-500 border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-white'
              }`}
            onClick={() => setActiveTab('categories')}
          >
            Category Breakdown
          </button>
          <button
            className={`px-6 py-4 font-medium transition-colors focus:outline-none flex items-center ${activeTab === 'details'
                ? 'text-emerald-500 border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-white'
              }`}
            onClick={() => setActiveTab('details')}
          >
            Transaction Details
            {selectedCategory && selectedMonth !== null && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></div>
            )}
          </button>
        </div>

        {/* Content area */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 custom-scrollbar"
        >
          {/* Scroll to top button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-10 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-colors focus:outline-none"
              aria-label="Scroll to top"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          )}

          {/* Trends View */}
          {activeTab === 'trends' && (
            <div>
              <div className="bg-neutral-900 rounded-lg p-6 mb-6">                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-medium text-emerald-500 mb-1">6-Month Overview</h3>
                  <p className="text-gray-400">
                    Your spending patterns from {sixMonthsData[0].month} to {sixMonthsData[sixMonthsData.length - 1].month}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Click on any data point to view detailed breakdown for that month
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-bold text-white">
                    ₹{formatAmount(sixMonthsData.reduce((acc, month) => acc + month.total, 0))}
                  </div>
                  <div className="text-sm text-gray-400">Total Spend</div>

                  {/* Trend indicator */}
                  {sixMonthsData.length > 1 && (
                    <div className={`text-xs flex items-center mt-2 ${sixMonthsData[sixMonthsData.length - 1].total > sixMonthsData[sixMonthsData.length - 2].total
                        ? 'text-red-400'
                        : 'text-emerald-400'
                      }`}>
                      {sixMonthsData[sixMonthsData.length - 1].total > sixMonthsData[sixMonthsData.length - 2].total ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Trending up from last month
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                          </svg>
                          Trending down from last month
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

                <div className="h-72 mt-6 area-chart-container chart-wrapper relative">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="text-xs bg-black bg-opacity-40 px-2 py-1 rounded-md text-gray-300 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
                      Monthly expense trend
                    </div>
                  </div>
                  <Line
                    data={getTrendData()}
                    options={trendChartOptions as any}
                    // @ts-ignore - Chart.js types don't match react-chartjs-2 for onClick
                    getElementAtEvent={(elements, event) => {
                      if (elements && elements.length > 0) {
                        const dataIndex = elements[0].index;
                        // Set the selected month for detailed view
                        setSelectedMonth(dataIndex);
                        // Optionally switch tab to see more data
                        // setActiveTab('categories');
                      }
                      return [];
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="bg-neutral-900 rounded-lg p-5 hover:bg-neutral-800 transition-all hover:shadow-lg hover:scale-105 duration-300">
                  <div className="text-sm text-gray-400 mb-1">Monthly Average</div>
                  <div className="text-2xl font-medium text-white">
                    ₹{formatAmount(sixMonthsData.reduce((acc, month) => acc + month.total, 0) / sixMonthsData.length)}
                  </div>
                  <div className="text-xs text-emerald-400 mt-2">
                    <span className="inline-flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      6-month calculation
                    </span>
                  </div>
                </div>
                <div className="bg-neutral-900 rounded-lg p-5 hover:bg-neutral-800 transition-all hover:shadow-lg hover:scale-105 duration-300">
                  <div className="text-sm text-gray-400 mb-1">Highest Month</div>
                  <div className="text-2xl font-medium text-white">
                    ₹{formatAmount(Math.max(...sixMonthsData.map(m => m.total)))}
                  </div>
                  <div className="text-xs text-yellow-400 mt-2">
                    <span className="inline-flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Peak spending
                    </span>
                  </div>
                </div>
                <div className="bg-neutral-900 rounded-lg p-5 hover:bg-neutral-800 transition-all hover:shadow-lg hover:scale-105 duration-300">
                  <div className="text-sm text-gray-400 mb-1">Top Category</div>
                  <div className="text-xl font-medium text-white capitalize">
                    {getCategorySpending(sixMonthsData.findIndex(m => m.total === Math.max(...sixMonthsData.map(m => m.total))))[0]?.category || '-'}
                  </div>
                  <div className="text-xs text-blue-400 mt-2">
                    <span className="inline-flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Most frequent
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sixMonthsData.map((month, index) => (
                  <div key={index} className="bg-neutral-900 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-white">{month.month}</h4>
                      <div className="flex flex-col items-end">
                        <div className="text-xl font-bold text-emerald-500">₹{formatAmount(month.total)}</div>
                        {index > 0 && (
                          <div className="text-xs">
                            <span
                              className={
                                month.total >= sixMonthsData[index - 1].total
                                  ? 'text-red-400'
                                  : 'text-emerald-400'
                              }
                            >
                              {(((month.total / sixMonthsData[index - 1].total) - 1) * 100).toFixed(1)}%
                              {month.total >= sixMonthsData[index - 1].total ? ' ↑' : ' ↓'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mt-3">
                      {getCategorySpending(index)
                        .slice(0, expandedMonths[index] ? undefined : 3)
                        .map((category, i) => (
                          <div key={i} className="flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-sm mr-2"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm text-gray-300 capitalize">{category.category}</span>
                              </div>
                              <div className="text-sm font-medium text-white">{category.value}%</div>
                            </div>
                            {/* Mini horizontal bar for each category */}
                            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${category.value}%`,
                                  backgroundColor: category.color
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      {getCategorySpending(index).length > 3 && !expandedMonths[index] && (
                        <div
                          className="text-xs text-gray-500 text-center mt-2 py-1.5 hover:bg-neutral-800 rounded cursor-pointer transition-colors"
                          onClick={() => setExpandedMonths(prev => ({ ...prev, [index]: true }))}
                        >
                          + {getCategorySpending(index).length - 3} more categories
                        </div>
                      )}
                      {expandedMonths[index] && (
                        <div
                          className="text-xs text-gray-500 text-center mt-2 py-1.5 hover:bg-neutral-800 rounded cursor-pointer transition-colors"
                          onClick={() => setExpandedMonths(prev => ({ ...prev, [index]: false }))}
                        >
                          Show less
                        </div>
                      )}

                      {/* Stacked mini bar visualization (showing each category's proportion) */}
                      <div className="mt-4 pt-3 border-t border-neutral-800">
                        <div className="text-xs text-gray-500 mb-2">Category Breakdown</div>
                        <div className="flex h-3 w-full rounded-md overflow-hidden stacked-bar-container">
                          {getCategorySpending(index).map((cat, i) => (
                            <div
                              key={i}
                              style={{
                                backgroundColor: cat.color,
                                width: `${cat.value}%`,
                              }}
                              className="h-full transition-all duration-300 category-bar"
                              title={`${cat.category}: ${cat.value}%`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories View */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-white">Category Analysis</h3>
                <div className="inline-flex rounded-md shadow-sm">
                  {sixMonthsData.map((month, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium ${selectedMonth === index
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800'
                        } ${index === 0
                          ? 'rounded-l-md'
                          : index === sixMonthsData.length - 1
                            ? 'rounded-r-md'
                            : ''
                        } border border-neutral-700`}
                      onClick={() => setSelectedMonth(index)}
                    >
                      {month.month}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMonth !== null ? (
                <div className="bg-neutral-900 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-medium text-white">
                      {sixMonthsData[selectedMonth].month} Category Breakdown
                    </h4>
                    <div className="text-xl font-bold text-emerald-500">
                      ₹{formatAmount(sixMonthsData[selectedMonth].total)}
                    </div>
                  </div>

                  {/* Mini horizontal bar chart visualization */}
                  <div className="mb-6">
                    <h4 className="text-gray-400 text-sm mb-2">Category Distribution by Percentage</h4>
                    <div className="h-64 bar-chart-container bg-neutral-800 p-3 rounded-lg">
                      <Bar
                        data={getCategoryDistribution(selectedMonth)}
                        options={horizontalBarOptions as any}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {getCategorySpending(selectedMonth).map((category, index) => {
                      const amount = (category.value / 100) * sixMonthsData[selectedMonth].total;
                      // Get detailed category amount info
                      const categoryDetails = getCategoryAmounts(selectedMonth).find(
                        cat => cat.category === category.category
                      );

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedCategory === category.category
                              ? 'bg-neutral-800 border-l-4 border-emerald-500'
                              : 'hover:bg-neutral-800'
                            }`}
                          onClick={() => {
                            setSelectedCategory(category.category);
                            // selectedMonth is already set from the month selection above
                            setActiveTab('details');
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-sm mr-3"
                                style={{ backgroundColor: category.color }}
                              />
                              <h5 className="text-white font-medium capitalize">{category.category}</h5>
                            </div>
                            <div className="text-emerald-500 font-medium">₹{formatAmount(amount)}</div>
                          </div>

                          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${category.value}%`,
                                backgroundColor: category.color
                              }}
                            />
                          </div>

                          <div className="flex justify-between mt-2 text-xs">
                            <div className="text-gray-400">
                              ~{categoryDetails ? categoryDetails.count : Math.max(1, Math.round(category.value / 10))} transactions
                            </div>
                            <div className="text-gray-300 font-medium">{category.value}% of total</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-neutral-900 rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Select a Month</h3>
                  <p className="text-gray-400">Choose a month from the tabs above to view category breakdown.</p>
                </div>
              )}
            </div>
          )}

          {/* Transaction Details View */}
          {activeTab === 'details' && renderTransactionDetails()}
        </div>
      </div>
    </div>
  );
};

export default ExpenseHistoryAlternativeView;
