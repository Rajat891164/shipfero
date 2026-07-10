import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Clock
} from 'lucide-react';

const Reports = () => {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const categories = ['All', 'Operational', 'Sales', 'Post-Shipping', 'Analytics', 'Financial'];

  const reports = [
    { title: 'Master MIS Report', desc: 'Complete shipment lifecycle view with all status milestones and TAT.', icon: FileSpreadsheet, category: 'Operational' },
    { title: 'Orders Report', desc: 'Filter orders by date, status, channel and export for accounting.', icon: FileText, category: 'Sales' },
    { title: 'NDR Performance', desc: 'Analyze re-attempt success rates and failure reasons by courier.', icon: BarChart3, category: 'Post-Shipping' },
    { title: 'In-Transit Delay', desc: 'Find shipments delayed beyond expected delivery date.', icon: Clock, category: 'Post-Shipping' },
    { title: 'Product Wise Status', desc: 'SKU level delivery rates and performance metrics.', icon: PieChartIcon, category: 'Analytics' },
    { title: 'Wallet Statement', desc: 'Detailed debit/credit logs for shipping charges and recharges.', icon: FileText, category: 'Financial' },
  ];

  const filteredReports = activeCategory === 'All' 
    ? reports 
    : reports.filter(r => r.category === activeCategory);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-main">
             <BarChart3 className="text-primary w-8 h-8" />
             Analytics & Reports
          </h2>
          <p className="text-muted text-sm mt-1">Generate and download detailed reports for analysis and accounting.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-surface-light px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-muted hover:text-primary transition-colors" onClick={() => alert('Opening report scheduler...')}>
              <Calendar className="w-4 h-4" /> SCHEDULE REPORTS
           </button>
        </div>
      </div>

      {/* Categories / Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeCategory === cat 
                ? 'bg-primary/20 text-primary shadow-neon' 
                : 'text-muted bg-surface-light/50 hover:bg-main/5 hover:text-main'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report, i) => (
          <div key={i} className="glass-card p-6 flex flex-col justify-between hover:bg-main/5 transition-all group">
             <div>
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-surface-light rounded-xl group-hover:shadow-neon transition-shadow">
                      <report.icon className="w-6 h-6 text-primary" />
                   </div>
                   <span className="text-[9px] font-bold text-muted bg-surface-light px-2 py-0.5 rounded uppercase tracking-widest">{report.category}</span>
                </div>
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors text-main">{report.title}</h3>
                <p className="text-xs text-muted leading-relaxed mb-6">{report.desc}</p>
             </div>
             <div className="flex gap-2">
                <button className="flex-1 py-2 bg-surface-light text-main text-xs font-bold rounded-lg transition-all hover:bg-surface-hover" onClick={() => alert(`Generating ${report.title}...`)}>GENERATE</button>
                <button className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-background transition-all" onClick={() => alert(`Downloading last generated ${report.title}...`)}>
                   <Download className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
           <div className="col-span-full py-12 text-center text-muted italic">No reports found in this category.</div>
        )}
      </div>

      {/* Scheduled Downloads Section */}
      <div className="glass-card overflow-hidden">
         <div className="p-6 flex justify-between items-center bg-surface-light/30">
            <h3 className="font-bold flex items-center gap-2 text-sm italic text-main">
               <Download className="w-4 h-4" /> RECENTLY GENERATED REPORTS
            </h3>
         </div>
         <div className="p-12 text-center text-main">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-surface-light rounded-full">
                <FileText className="w-8 h-8 text-muted opacity-20" />
              </div>
              <div>
                <p className="text-sm font-medium">No reports generated in the last 48 hours.</p>
                <p className="text-[10px] uppercase font-bold mt-1 text-muted">Reports are available for download for 7 days.</p>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;
