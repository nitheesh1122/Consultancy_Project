const fs = require('fs');
const path = require('path');

const filePaths = ['src/pages/hr/HRWorkerList.tsx'];

const replacements = {
    'bg-surface-highlight': 'bg-elevated',
    'border-border': 'border-subtle',
    'text-danger': 'text-status-critical',
    'bg-danger': 'bg-status-critical',
    'text-success': 'text-status-success',
    'bg-success': 'bg-status-success',
    'text-warning': 'text-status-warning',
    'bg-warning': 'bg-status-warning',
    'text-info': 'text-status-info',
    'bg-info': 'bg-status-info',
    'bg-background': 'bg-void',
    'bg-blue-50 text-blue-700 border-blue-200': 'bg-status-info/10 text-status-info border-status-info/30',
    'bg-green-100 text-green-800': 'bg-status-success/10 text-status-success',
    'bg-orange-100 text-orange-800': 'bg-status-warning/10 text-status-warning',
    'bg-blue-100 text-blue-800': 'bg-status-info/10 text-status-info',
    'bg-primary/10 text-primary border-primary/20': 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    'text-blue-600 hover:text-blue-800': 'text-brand-gold hover:text-brand-gold/80',
    'bg-primary text-primary hover:bg-primary-hover': 'bg-brand-gold text-slate-950 hover:bg-brand-gold/90 font-bold',
    'text-red-800': 'text-status-critical/80',
    'bg-red-100': 'bg-status-critical/20'
};

filePaths.forEach(relPath => {
    const filePath = path.join(__dirname, relPath);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    for (const [search, replace] of Object.entries(replacements)) {
        content = content.replace(new RegExp(search, 'g'), replace);
    }

    fs.writeFileSync(filePath, content);
    console.log(`Token replacement complete for ${relPath}`);
});
