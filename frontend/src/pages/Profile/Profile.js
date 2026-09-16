import React from 'react';
import './Profile.css';

const ProfileTemplate = () => {
  // Easily swap this object data out for your own details
  const profileData = {
    name: "Homer J. Simpson",
    title: "Safety Inspector & Nuclear Technician",
    location: "Springfield, USA",
    avatar: "https://unsplash.com", // Placeholder asset
    bio: "Experienced Safety Inspector with a demonstrated history of overlooking critical system alerts at the Springfield Nuclear Power Plant. Skilled in crisis mitigation (accidental), donut inventory control, and couch testing. Known for a highly relaxed operational philosophy.",
    
    skills: ["Nuclear Safety (Basic)", "Donut Quality Assurance", "Crisis Mitigation", "Nap Optimization", "Catchphrase Delivery (D'oh!)"],
    
    experience: [
      {
        role: "Safety Inspector",
        company: "Springfield Nuclear Power Plant",
        period: "1989 - Present",
        description: "Responsible for monitoring Core Sector 7-G. Successfully survived multiple core meltdowns while maintaining a consistent nap schedule. Handled indicator lights and alarm silences."
      },
      {
        role: "Lead Singer & Songwriter",
        company: "The Beasharps (Barbershop Quartet)",
        period: "1993",
        description: "Achieved global musical fame, won a Grammy Award, and spearheaded a chart-topping album before retiring back to the nuclear industry."
      },
      {
        role: "Astronaut",
        company: "NASA",
        period: "1994",
        description: "Selected for the civilian space flight program. Successfully orbited Earth, introduced an experimental space-ant colony, and secured an inanimate carbon rod."
      }
    ],
    
    education: [
      {
        degree: "Nuclear Physics Crash Course",
        school: "Springfield University",
        year: "1993"
      },
      {
        degree: "High School Diploma",
        school: "Springfield High School",
        year: "1974"
      }
    ]
  };

  return (
    <div className="profile-container">
      {/* Top Header Section */}
      <header className="profile-header">
        <div className="avatar-wrapper">
          <img src={profileData.avatar} alt={profileData.name} className="profile-avatar" />
        </div>
        <div className="header-info">
          <h1>{profileData.name}</h1>
          <h2>{profileData.title}</h2>
          <p className="location">{profileData.location}</p>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="profile-body">
        {/* Left Side: About & Experience */}
        <main className="profile-main">
          <section className="profile-section">
            <h3>About</h3>
            <p className="bio-text">{profileData.bio}</p>
          </section>

          <section className="profile-section">
            <h3>Experience</h3>
            {profileData.experience.map((job, index) => (
              <div key={index} className="experience-item">
                <div className="item-header">
                  <h4>{job.role}</h4>
                  <span className="item-date">{job.period}</span>
                </div>
                <h5>{job.company}</h5>
                <p>{job.description}</p>
              </div>
            ))}
          </section>

          <section className="profile-section">
            <h3>Education</h3>
            {profileData.education.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="item-header">
                  <h4>{edu.degree}</h4>
                  <span className="item-date">{edu.year}</span>
                </div>
                <h5>{edu.school}</h5>
              </div>
            ))}
          </section>
        </main>

        {/* Right Side: Skills Sidebar */}
        <aside className="profile-sidebar">
          <section className="profile-section">
            <h3>Skills</h3>
            <div className="skills-tags">
              {profileData.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProfileTemplate;
