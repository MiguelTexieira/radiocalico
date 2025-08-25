document.addEventListener('DOMContentLoaded', function() {
    checkHealth();
    getDbInfo();
});

async function checkHealth() {
    const statusDiv = document.getElementById('status');
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            statusDiv.textContent = 'All systems operational';
            statusDiv.className = 'healthy';
        } else {
            statusDiv.textContent = 'Error: ' + data.message;
            statusDiv.className = 'error';
        }
    } catch (error) {
        statusDiv.textContent = 'Failed to connect to server';
        statusDiv.className = 'error';
    }
}

async function getDbInfo() {
    const dbInfoDiv = document.getElementById('db-info');
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        
        if (!data.error) {
            dbInfoDiv.innerHTML = `
                <strong>Database:</strong> ${data.current_database}<br>
                <strong>User:</strong> ${data.current_user}<br>
                <strong>Version:</strong> ${data.version.split('\n')[0]}
            `;
        } else {
            dbInfoDiv.innerHTML = `<span style="color: red;">Database Error: ${data.error}</span>`;
        }
    } catch (error) {
        dbInfoDiv.innerHTML = `<span style="color: red;">Failed to get database info</span>`;
    }
}