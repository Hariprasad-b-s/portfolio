document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch('assets/data.json');
        const data = await response.json();

        renderHero(data.profile, data.experience);
        renderAbout(data.summary, data.profile);
        renderSkills(data.skills);
        renderExperience(data.experience);
        renderContact(data.profile);
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML = '<h1 style="text-align:center; padding-top: 20%; color: red">Error loading profile data. Please check console.</h1>';
    }
}

function renderHero(profile, experience) {
    document.getElementById('hero-name').textContent = profile.name;
    document.getElementById('hero-role').textContent = profile.role;

    // Calculate years of experience
    const startYear = 2021; // Based on Resume (Infosys start)
    const currentYear = new Date().getFullYear();
    const expYears = currentYear - startYear;

    const statsConfig = [
        { label: 'Years Exp', value: `${expYears}+` },
        { label: 'Projects', value: '10+' }, // Estimating based on detailed resume bullets
        { label: 'Tech Stack', value: '15+' }
    ];

    const statsContainer = document.getElementById('hero-stats');
    statsConfig.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `<h3>${stat.value}</h3><p>${stat.label}</p>`;
        statsContainer.appendChild(div);
    });
}

function renderAbout(summary, profile) {
    document.getElementById('about-content').innerHTML = `
        <p>${summary}</p>
        <p style="margin-top: 1rem">Currently based in <strong>${profile.location}</strong>.</p>
    `;

    // Render "JSON" view in the terminal window
    const jsonView = {
        name: profile.name,
        role: profile.role,
        skills: ["Data Engineering", "Cloud", "Python"],
        status: "Open to Work",
        location: profile.location
    };

    document.getElementById('code-block').textContent = JSON.stringify(jsonView, null, 2);
}

function renderSkills(skills) {
    const container = document.getElementById('skills-container');

    for (const [category, items] of Object.entries(skills)) {
        const card = document.createElement('div');
        card.className = 'skill-category';

        // Make Data Engineering span full width
        if (category === 'Data Engineering') {
            card.classList.add('full-width');
        }

        const tags = items.map(skill => `<span class="skill-tag">${skill}</span>`).join('');

        card.innerHTML = `
            <h3>${category}</h3>
            <div class="skill-tags">
                ${tags}
            </div>
        `;
        container.appendChild(card);
    }
}

function renderExperience(experience) {
    const container = document.getElementById('experience-container');

    experience.forEach(job => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const bullets = job.highlights.map(h => `<li>${h}</li>`).join('');

        item.innerHTML = `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <span class="role">${job.role}</span>
                        <span class="company">@ ${job.company}</span>
                    </div>
                    <div>
                        <span class="date">${job.period}</span>
                    </div>
                </div>
                <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <ul class="job-details" style="margin-top: 1rem">
                    ${bullets}
                </ul>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderContact(profile) {
    const container = document.getElementById('contact-container');
    const { contact } = profile;

    const links = [
        { prefix: 'fas', icon: 'fa-envelope', label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
        { prefix: 'fab', icon: 'fa-linkedin', label: 'LinkedIn', value: 'hariprasadbs', href: contact.linkedin },
        { prefix: 'fab', icon: 'fa-github', label: 'GitHub', value: 'Hariprasad-b-s', href: contact.github },
        { prefix: 'fas', icon: 'fa-phone', label: 'Phone', value: contact.phone, href: `tel:${contact.phone}` }
    ];

    links.forEach(link => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3><i class="${link.prefix} ${link.icon}"></i> ${link.label}</h3>
            <a href="${link.href}" target="_blank">${link.value}</a>
        `;
        container.appendChild(div);
    });
}

/* Resume Modal Logic */
function openResumeModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('resume-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeResumeModal() {
    const modal = document.getElementById('resume-modal');
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal if clicked outside content
window.addEventListener('click', (e) => {
    const modal = document.getElementById('resume-modal');
    if (e.target === modal) {
        closeResumeModal();
    }
});
