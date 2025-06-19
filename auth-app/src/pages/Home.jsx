import { useNavigate } from 'react-router-dom';
import '../assets/Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className='home_wrapper'>
      <header>
        <div className='logo'>
          <img src='/img/logo.png' alt='logo' />
          <span>
            <span style={{ color: '#FDD563' }}>OPEN</span> LESSON
          </span>
        </div>
        <nav>
          {['HOME', 'ABOUT', 'SERVICE', 'CONTACT'].map(label => (
            <a key={label} href='#'>
              {label}
            </a>
          ))}
        </nav>
        <div className='sign-buttons'>
          <button className='signup-btn' onClick={() => navigate('/register')}>
            Sign up
          </button>
          <button className='signin-btn' onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>
      </header>

      <main>
        <div className='hero-text'>
          <h1>
            LEARN TECH.
            <br />
            <span>BUILD FUTURE.</span>
          </h1>
          <p>
            Start your journey into web development and UI/UX design. Build
            real-world projects, explore the latest tools, and sharpen your
            skills for the job market.
          </p>
          <button className='getstarted-btn' onClick={() => navigate('/register')}>
            GET STARTED
          </button>
        </div>
        <div className='hero-img'>
          <img src='/img/student.jpg' alt='Student Illustration' />
        </div>
      </main>

      <footer>&copy; 2025 Open Lesson. All rights reserved.</footer>
    </div>
  );
};

export default Home;