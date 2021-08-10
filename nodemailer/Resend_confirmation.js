const Confirm_Resend_Email_HTML = (user_mail_data) => {
  return `<h1>Email Confirmation</h1>
        <h2>Hello ${user_mail_data.req.cookies.user_data.firstName}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=${process.env.Local_PORT}/signup/confirm/${user_mail_data.token}> Click here</a>
        </div>`;
};

const Confirm_Resend_Email_Subject = () => {
  return `Please confirm your account`;
};

module.exports = { Confirm_Resend_Email_HTML, Confirm_Resend_Email_Subject };
