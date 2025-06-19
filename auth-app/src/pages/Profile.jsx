import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dob, setDob] = useState('');
  const [mfaMethod, setMfaMethod] = useState('email');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setEmail(localStorage.getItem('email') || '');
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = Number(localStorage.getItem('userId'));
      if (!userId) return;

      try {
        const response = await fetch(
          `http://localhost:3001/api/profile/${userId}`
        );
        const data = await response.json();

        if (data.success) {
          setFullName(data.fullName || '');
          setStudentId(data.studentId || '');
          setDob(
            data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''
          );
          setMfaMethod(data.mfaMethod || 'email');
        }
      } catch (error) {
        console.error('Profile load failed:', error);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    const userId = Number(localStorage.getItem('userId'));
    const payload = { userId, fullName, studentId, dob, mfaMethod };

    try {
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const { success, error } = await response.json();

      if (success) {
        setIsDirty(false);
        alert('Profile saved');
      } else {
        alert(`Save failed: ${error}`);
      }
    } catch (error) {
      console.error('Profile save error:', error);
      alert('Server error');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className='profile_wrapper'>
      <header className='app-header'>
        <div className='logo'>Open Lesson</div>
        <button className='logout-btn' onClick={handleLogout}>
          Log Out
        </button>
      </header>

      <div className='profile-page'>
        <aside className='sidebar'>
          {['account', 'courses', 'grades', 'settings'].map(tab => (
            <div
              key={tab}
              className={`tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </aside>

        <div className='content'>
          {activeTab === 'account' && (
            <>
              <h2>Account</h2>
              <div className='field'>
                <label>Full Name</label>
                <input
                  type='text'
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder='Enter your name'
                />
              </div>

              <div className='field'>
                <label>Email address</label>
                <input type='email' value={email} readOnly />
              </div>

              <div className='field'>
                <label>Student ID</label>
                <input
                  type='text'
                  value={studentId}
                  onChange={e => {
                    setStudentId(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder='Enter student ID'
                />
              </div>

              <div className='field'>
                <label>Date of Birth</label>
                <input
                  type='date'
                  value={dob}
                  onChange={e => {
                    setDob(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              <button
                className='save-button'
                onClick={handleSave}
                disabled={!isDirty}
              >
                Save
              </button>
            </>
          )}

          {activeTab === 'courses' && (
            <>
              <h2>My Courses</h2>
              <ul className='courses-list'>
                <li>Introduction to Web Development</li>
                <li>Advanced JavaScript</li>
                <li>Usable Security in Practice</li>
              </ul>
            </>
          )}

          {activeTab === 'grades' && (
            <>
              <h2>Grades</h2>
              <table className='grades-table'>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Web Development</td>
                    <td>A−</td>
                  </tr>
                  <tr>
                    <td>JavaScript</td>
                    <td>B+</td>
                  </tr>
                  <tr>
                    <td>Security</td>
                    <td>A</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <h2>Settings</h2>
              <div className='field'>
                <label>Multi-Factor Method</label>
                <select
                  value={mfaMethod}
                  onChange={e => {
                    setMfaMethod(e.target.value);
                    setIsDirty(true);
                  }}
                >
                  <option value='email'>Email</option>
                  <option value='sms'>SMS</option>
                  <option value='totp'>Google Auth</option>
                </select>
              </div>

              <button
                className='save-button'
                onClick={handleSave}
                disabled={!isDirty}
              >
                Save Settings
              </button>
            </>
          )}
        </div>
      </div>

      <footer className='app-footer'>&copy; 2025 Open Lesson. All rights reserved.</footer>
    </div>
  );
};

export default Profile;