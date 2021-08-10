const Signup_Email_HTML = (user_mail_data) => {
  return `<h1>Email Confirmation</h1>
        <h2>Hello ${user_mail_data.result.user_name.firstName}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=${process.env.Local_PORT}/signup/confirm/${user_mail_data.result.user_confirmationCode}> Click here</a>
        </div>`;
};

const Signup_Email_Subject = () => {
  return `Please confirm your account`;
};

module.exports = { Signup_Email_HTML, Signup_Email_Subject };
