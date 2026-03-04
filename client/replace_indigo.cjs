const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/Home.tsx',
    'src/pages/Inventory.tsx',
    'src/pages/RaisePI.tsx',
    'src/pages/InwardEntry.tsx',
    'src/pages/hr/HRWorkerList.tsx',
    'src/pages/production/MachineMaster.tsx',
    'src/pages/production/LiveMonitor.tsx',
    'src/pages/analytics/AnalyticsInventory.tsx',
    'src/pages/analytics/AnalyticsProduction.tsx',
    'src/pages/analytics/AnalyticsWorkers.tsx',
    'src/pages/analytics/AnalyticsSuppliers.tsx',
    'src/components/Charts.tsx',
    'src/components/ui/MetricCard.tsx',
    'src/components/ui/DecisionExplanation.tsx'
];

const tokenMap = {
    'bg-surface-highlight': 'bg-elevated',
    'border-border': 'border-subtle',
    'bg-surface': 'bg-card',
    'bg-void': 'bg-canvas',
    'bg-background': 'bg-canvas',
    'brand-gold': 'brand-primary',
    'bg-danger': 'bg-status-danger',
    'text-danger': 'text-status-danger',
    'border-danger': 'border-status-danger',
    'bg-warning': 'bg-status-warning',
    'text-warning': 'text-status-warning',
    'border-warning': 'border-status-warning',
    'bg-success': 'bg-status-success',
    'text-success': 'text-status-success',
    'border-success': 'border-status-success',
    'status-critical': 'status-danger'
};

filesToProcess.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${filePath} (not found)`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace tokens using map safely
    for (const [oldToken, newToken] of Object.entries(tokenMap)) {
        const regex = new RegExp(oldToken, 'g');
        content = content.replace(regex, newToken);
    }

    // Specific Inventory Add Material button removal logic if present
    if (filePath.includes('Inventory.tsx')) {
        content = content.replace(/<Button[^>]*Add Material.*?<\/Button>/s, '');
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Processed ${filePath}`);
});
