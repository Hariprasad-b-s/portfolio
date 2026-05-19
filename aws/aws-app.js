/* Firebase Configuration & Initialization */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYzCgeD6R2jPku9I-0L4eXdAPPrpMWJAs",
    authDomain: "portfolio-hariprasad.firebaseapp.com",
    projectId: "portfolio-hariprasad",
    storageBucket: "portfolio-hariprasad.firebasestorage.app",
    messagingSenderId: "808922330158",
    appId: "1:808922330158:web:9109ccb0e8e72bb9f7dbbf",
    measurementId: "G-LPJCR31XRZ"
};

let db;
let analytics;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    console.log("Firebase & Analytics initialized (AWS Portfolio)");
} catch (error) {
    console.warn("Firebase config missing or invalid.");
}

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupMobileMenu();
});

function setupMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
}

async function fetchData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        renderHero(data.profile, data.experience);
        renderAbout(data.summary, data.profile);
        renderAWSServices(data.awsServices);
        renderSkills(data.skills);
        renderExperience(data.experience);
        renderProjects(data.projects);
        renderEducation(data.education);
        renderContact(data.profile);
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML = '<h1 style="text-align:center; padding-top: 20%; color: #FF9900;">Error loading AWS profile data.</h1>';
    }
}

function renderHero(profile, experience) {
    document.getElementById('hero-name').textContent = profile.name;
    document.getElementById('hero-role').textContent = profile.role;

    const startYear = 2021;
    const currentYear = new Date().getFullYear();
    const expYears = currentYear - startYear;

    const statsConfig = [
        { label: 'Years Exp', value: `${expYears}+` },
        { label: 'AWS Services', value: '10+' },
        { label: 'Pipelines Built', value: '15+' }
    ];

    const statsContainer = document.getElementById('hero-stats');
    statsConfig.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `<h3>${stat.value}</h3><p>${stat.label}</p>`;
        statsContainer.appendChild(div);
    });

    // Social sidebar
    const socialContainer = document.getElementById('hero-social');
    const socials = [
        { icon: 'fab fa-linkedin-in', href: profile.contact.linkedin, label: 'LinkedIn' },
        { icon: 'fab fa-github', href: profile.contact.github, label: 'GitHub' },
        { icon: 'fas fa-envelope', href: `mailto:${profile.contact.email}`, label: 'Email' }
    ];
    socials.forEach(s => {
        const a = document.createElement('a');
        a.href = s.href; a.target = '_blank'; a.className = 'hero-social-link';
        a.setAttribute('aria-label', s.label);
        a.innerHTML = `<i class="${s.icon}"></i><span>${s.label}</span>`;
        socialContainer.appendChild(a);
    });
}

function renderAbout(summary, profile) {
    document.getElementById('about-content').innerHTML = `
        <p>${summary}</p>
        <p style="margin-top: 1rem">Currently based in <strong>${profile.location}</strong>.</p>
    `;

    const jsonView = {
        name: profile.name,
        role: profile.role,
        focus: "AWS Data Engineering",
        coreServices: ["Glue", "EMR", "S3", "Lambda", "Redshift"],
        status: "Open to Work",
        location: profile.location
    };
    document.getElementById('code-block').textContent = JSON.stringify(jsonView, null, 2);
}

function renderAWSServices(services) {
    const container = document.getElementById('aws-services-container');
    services.forEach(svc => {
        const card = document.createElement('div');
        card.className = 'aws-service-card';
        card.innerHTML = `
            <i class="fas ${svc.icon}"></i>
            <h4>${svc.name}</h4>
            <p>${svc.desc}</p>
        `;
        container.appendChild(card);
    });
}

function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    for (const [category, items] of Object.entries(skills)) {
        const card = document.createElement('div');
        card.className = 'skill-category';
        if (category === 'Data Engineering' || category === 'Cloud & DevOps') {
            card.classList.add('full-width');
        }
        const tags = items.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
        card.innerHTML = `<h3>${category}</h3><div class="skill-tags">${tags}</div>`;
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
                    <div><span class="date">${job.period}</span></div>
                </div>
                <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <ul class="job-details" style="margin-top: 1rem">${bullets}</ul>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        const bullets = project.highlights.map(h => `<li>${h}</li>`).join('');
        const statusClass = project.status === 'Completed' ? 'completed' : 'in-progress';
        const githubBtn = project.url
            ? `<a href="${project.url}" target="_blank" class="btn project-github-btn"><i class="fab fa-github"></i> View on GitHub</a>`
            : '';
        card.innerHTML = `
            <div class="project-header">
                <i class="fas fa-folder-open project-icon"></i>
                <div>
                    <h3>${project.title}</h3>
                    <span class="project-status ${statusClass}">${project.status}</span>
                </div>
            </div>
            <ul class="project-details">${bullets}</ul>
            <div class="project-footer">${githubBtn}</div>
        `;
        container.appendChild(card);
    });
}

function renderEducation(education) {
    const container = document.getElementById('education-container');
    education.forEach(edu => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <span class="role">${edu.degree}</span>
                        <span class="company">@ ${edu.institution}</span>
                    </div>
                    <div><span class="date">${edu.period}</span></div>
                </div>
                <span class="location"><i class="fas fa-map-marker-alt"></i> ${edu.location}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderContact(profile) {
    const container = document.getElementById('contact-container');
    const { contact } = profile;
    const links = [
        { icon: 'fa-envelope', label: 'Email', value: contact.email, href: `mailto:${contact.email}`, prefix: 'fas' },
        { prefix: 'fab', icon: 'fa-linkedin', label: 'LinkedIn', value: 'hariprasadbs', href: contact.linkedin },
        { prefix: 'fab', icon: 'fa-github', label: 'GitHub', value: 'Hariprasad-b-s', href: contact.github },
        { prefix: 'fas', icon: 'fa-phone', label: 'Phone', value: contact.phone, href: `tel:${contact.phone}` }
    ];
    links.forEach(link => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3><a href="${link.href}" target="_blank" style="text-decoration:none; color:inherit;"><i class="${link.prefix} ${link.icon}"></i> ${link.label}</a></h3>
            <a href="${link.href}" target="_blank">${link.value}</a>
        `;
        container.appendChild(div);
    });
}

/* Resume Modal Logic */
window.openResumeModal = function (e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('resume-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    if (analytics) {
        logEvent(analytics, 'view_aws_resume');
    }
}

window.closeResumeModal = function () {
    const modal = document.getElementById('resume-modal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('resume-modal');
    if (e.target === modal) { closeResumeModal(); }
});

/* AJAX Form Submission */
const form = document.getElementById('contact-form');

async function handleSubmit(event) {
    event.preventDefault();
    const status = document.getElementById('form-status');

    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        status.innerHTML = "Error: Firebase Config not set.";
        status.className = "error";
        return;
    }

    status.innerHTML = "Transmitting to Cloud Firestore...";
    status.className = "";

    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        source: 'aws-portfolio',
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "contacts"), data);
        status.innerHTML = "Transmission Success! Stored in Cloud Firestore.";
        status.className = "success";
        form.reset();
        if (analytics) { logEvent(analytics, 'aws_contact_form_success'); }
    } catch (error) {
        console.error("Error adding document: ", error);
        status.innerHTML = "Transmission Failed: " + error.message;
        status.className = "error";
        if (analytics) { logEvent(analytics, 'aws_contact_form_error', { error: error.message }); }
    }

    setTimeout(() => { status.innerHTML = ""; status.className = ""; }, 5000);
}

form.addEventListener("submit", handleSubmit);
