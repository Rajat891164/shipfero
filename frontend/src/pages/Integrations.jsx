import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link as LinkIcon, Truck } from 'lucide-react';
import ChannelIntegrations from './ChannelIntegrations';
import CourierSettings from './CourierSettings';

const TABS = [
  { key: 'channels', label: 'Channel Integrations', icon: LinkIcon },
  { key: 'couriers', label: 'Courier Integrations', icon: Truck },
];

const Integrations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'couriers' ? 'couriers' : 'channels';

  const selectTab = (key) => {
    setSearchParams(key === 'couriers' ? { tab: 'couriers' } : {}, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <h2>Integrations</h2>
        <p>Connect the platforms and courier partners that power your shipping workflow.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              className={
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ' +
                (isActive
                  ? 'bg-primary text-background shadow-neon-sm'
                  : 'bg-surface-light text-muted hover:text-main hover:bg-surface-hover')
              }
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'channels' ? <ChannelIntegrations /> : <CourierSettings />}
      </div>
    </div>
  );
};

export default Integrations;
