document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('submissions-body');
    const totalInquiriesEl = document.getElementById('total-inquiries');
    const pendingReviewEl = document.getElementById('pending-review');
    const newSubmissionsBadge = document.getElementById('new-submissions-badge');
    
    let currentView = 'submissions'; // submissions, projects, clients
    let activeInquiryId = null;

    console.log("Admin Dashboard Initialized");

    // --- Global Modal Functions ---
    window.viewDetails = (id) => {
        console.log("Opening details for ID:", id);
        const data = JSON.parse(localStorage.getItem('gwg_inquiries')) || [];
        const item = data.find(i => i.id === id);
        if (!item) {
            console.error("Inquiry not found for ID:", id);
            return;
        }

        activeInquiryId = id;
        const modal = document.getElementById('details-modal');
        const content = document.getElementById('modal-content');
        const idLabel = document.getElementById('modal-project-id');

        idLabel.textContent = item.id;
        
        let fieldsHtml = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Client Info</h4>
                    <p class="text-lg">${item.name || 'N/A'}</p>
                    <p class="text-brand-gray">${item.email || 'N/A'}</p>
                    <p class="text-brand-gray">${item.phone || 'No phone'}</p>
                </div>
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Brand/Company</h4>
                    <p class="text-lg">${item.brand || 'Personal'}</p>
                    <p class="text-brand-gray truncate">${item.website || 'No links'}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Service Type</h4>
                    <p class="text-lg text-brand-accent">${item.service === '3d' ? '3D Animation' : 'Graphic Design'}</p>
                    <p class="text-brand-gray">Type: ${item.animation_type || item.design_type || 'N/A'}</p>
                </div>
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Style Preference</h4>
                    <p class="text-lg">${item.visual_style || item.design_style || 'N/A'}</p>
                    <p class="text-brand-gray">Mood: ${item.mood || 'N/A'}</p>
                </div>
            </div>

            <div class="space-y-4 pt-8 border-t border-white/5">
                <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Project Brief</h4>
                <div class="bg-white/5 p-6 rounded-2xl font-light leading-relaxed text-white/80">
                    ${item.product_detail || item.brand_identity || item.notes || 'No detailed brief.'}
                </div>
            </div>

            ${item.script ? `
            <div class="space-y-4 pt-8 border-t border-white/5">
                <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Script / Scene Breakdown</h4>
                <div class="bg-white/5 p-6 rounded-2xl font-light leading-relaxed text-white/80 whitespace-pre-wrap">${item.script}</div>
            </div>` : ''}

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Budget</h4>
                    <p class="text-xl font-medium text-green-400">$${item.budget ? Number(item.budget).toLocaleString() : '100'}</p>
                </div>
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Deadline</h4>
                    <p class="text-lg">${item.deadline || 'Flexible'}</p>
                </div>
                <div>
                    <h4 class="text-brand-gray text-[10px] uppercase tracking-widest mb-2">Launch Date</h4>
                    <p class="text-lg">${item.launch_date || 'N/A'}</p>
                </div>
            </div>
        `;

        content.innerHTML = fieldsHtml;
        modal.classList.remove('hidden');
    };

    window.closeModal = () => {
        document.getElementById('details-modal').classList.add('hidden');
    };

    window.updateInquiryStatus = (status) => {
        const data = JSON.parse(localStorage.getItem('gwg_inquiries')) || [];
        const index = data.findIndex(i => i.id === activeInquiryId);
        if (index !== -1) {
            data[index].status = status;
            localStorage.setItem('gwg_inquiries', JSON.stringify(data));
            loadData();
            closeModal();
        }
    };

    window.deleteInquiry = () => {
        if (!confirm('Are you sure you want to delete this inquiry?')) return;
        const data = JSON.parse(localStorage.getItem('gwg_inquiries')) || [];
        const newData = data.filter(i => i.id !== activeInquiryId);
        localStorage.setItem('gwg_inquiries', JSON.stringify(newData));
        loadData();
        closeModal();
    };

    window.refreshDashboard = () => {
        console.log("Manual refresh triggered");
        loadData();
    };

    window.addTestEntry = () => {
        const testData = {
            id: 'TEST-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            timestamp: new Date().toISOString(),
            status: 'new',
            service: '3d',
            name: 'Test Client',
            brand: 'Test Studio',
            email: 'test@example.com',
            budget: '5000',
            deadline: '2026-12-31',
            animation_type: 'Product Animation',
            visual_style: 'Luxury',
            product_detail: 'This is a test entry to verify the dashboard is working correctly.'
        };
        const data = JSON.parse(localStorage.getItem('gwg_inquiries')) || [];
        data.push(testData);
        localStorage.setItem('gwg_inquiries', JSON.stringify(data));
        console.log("Test entry added.");
        loadData();
    };

    // --- Core Logic ---
    function loadData() {
        console.log("%c ATTEMPTING TO LOAD DATA ", "background: #000; color: #2997ff; font-weight: bold;");
        
        const storageKey = 'gwg_inquiries';
        let data = [];
        
        try {
            const raw = localStorage.getItem(storageKey);
            data = JSON.parse(raw) || [];
            console.log(`Loaded ${data.length} entries from LocalStorage.`);
        } catch (e) {
            console.error("LocalStorage Error:", e);
        }

        // Fallback: Check SessionStorage if LocalStorage is empty (useful for same-tab testing)
        if (data.length === 0) {
            const lastSession = sessionStorage.getItem('last_submission');
            if (lastSession) {
                console.log("Found entry in SessionStorage fallback.");
                data = [JSON.parse(lastSession)];
            }
        }
        
        updateStats(data);
        
        if (currentView === 'submissions') renderSubmissions(data);
        else if (currentView === 'projects') renderProjects(data);
        else if (currentView === 'clients') renderClients(data);
    }

    function renderSubmissions(data) {
        if (!tableBody) return;
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="p-12 text-center text-brand-gray">No inquiries yet. Check back soon.</td></tr>';
            return;
        }

        tableBody.innerHTML = [...data].reverse().map(item => `
            <tr class="hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0">
                <td class="p-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-[10px] font-bold">
                            ${(item.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-medium">${item.name || 'Anonymous'}</p>
                            <p class="text-[10px] text-brand-gray">${item.brand || 'Personal'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-6">
                    <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider">
                        ${item.service === '3d' ? '3D' : 'Graphic'}
                    </span>
                </td>
                <td class="p-6 text-sm font-light">$${Number(item.budget || 0).toLocaleString()}</td>
                <td class="p-6 text-sm font-light text-brand-gray">${item.deadline || 'Flexible'}</td>
                <td class="p-6">
                    <span class="flex items-center space-x-2 text-[10px] uppercase tracking-wider ${item.status === 'approved' ? 'text-green-400' : 'text-brand-accent'}">
                        <span class="w-1.5 h-1.5 rounded-full ${item.status === 'approved' ? 'bg-green-400' : 'bg-brand-accent animate-pulse'}"></span>
                        <span>${item.status || 'new'}</span>
                    </span>
                </td>
                <td class="p-6 text-right">
                    <button onclick="viewDetails('${item.id}')" class="text-xs font-medium text-brand-gray hover:text-white transition-colors underline">Review</button>
                </td>
            </tr>
        `).join('');
    }

    function renderProjects(data) {
        const projects = data.filter(i => i.status === 'approved');
        tableBody.innerHTML = projects.length ? projects.map(p => `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                <td class="p-6 text-sm">${p.id}</td>
                <td class="p-6 text-sm font-medium">${p.name}</td>
                <td class="p-6 text-sm">${p.brand || 'Personal'}</td>
                <td class="p-6 text-sm">${p.service.toUpperCase()}</td>
                <td colspan="2" class="p-6 text-right">
                    <span class="text-[10px] text-green-400 uppercase tracking-widest px-3 py-1 border border-green-400/20 rounded-full">In Production</span>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="p-12 text-center text-brand-gray">No approved projects yet.</td></tr>';
    }

    function renderClients(data) {
        const clients = [...new Map(data.map(i => [i.email, i])).values()];
        tableBody.innerHTML = clients.length ? clients.map(c => `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                <td class="p-6">
                    <p class="text-sm font-medium">${c.name}</p>
                    <p class="text-xs text-brand-gray">${c.email}</p>
                </td>
                <td class="p-6 text-sm">${c.brand || 'N/A'}</td>
                <td class="p-6 text-sm">${c.phone || 'N/A'}</td>
                <td colspan="3" class="p-6 text-right">
                    <span class="text-[10px] uppercase text-brand-accent">Client Account Active</span>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="p-12 text-center text-brand-gray">No clients found.</td></tr>';
    }

    function updateStats(data) {
        if (totalInquiriesEl) totalInquiriesEl.textContent = data.length;
        const pending = data.filter(i => i.status === 'new' || !i.status).length;
        if (pendingReviewEl) pendingReviewEl.textContent = pending;
        if (newSubmissionsBadge) {
            newSubmissionsBadge.textContent = `${pending} New`;
            newSubmissionsBadge.style.display = pending > 0 ? 'block' : 'none';
        }
    }

    // Sidebar Navigation Fix
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentView = this.querySelector('span').textContent.toLowerCase();
            console.log("View switched to:", currentView);
            loadData();
        });
    });

    // Auto-refresh on focus
    window.addEventListener('focus', loadData);
    
    // Initial Load
    loadData();
});
