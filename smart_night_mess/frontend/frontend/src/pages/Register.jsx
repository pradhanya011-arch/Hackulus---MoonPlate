function Register() {
  return (
    <div>
      <h1>MoonPlate Register</h1>

      <input
        type="text"
        placeholder="Name"
      />

      <br /><br />

      <input
        type="email"
        placeholder="Email"
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
      />

      <br /><br />

      <button>Register</button>

      <p>
        Already have an account? Login
      </p>
    </div>
  );
}

export default Register;