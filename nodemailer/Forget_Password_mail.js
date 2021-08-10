const Forget_password_regenerate_Email_HTML = (user_mail_data) => {
  return `<h1>Forget Password Request</h1>
          <h2>Hello ${user_mail_data.result.user_name.firstName}</h2>
          <p>To reset your password click on the following link</p>
          <a href=${process.env.Local_PORT}/forgetpassword/passwordreset/${user_mail_data.token}> Click here</a>
          </div>`;
};

const Forget_password_regenerate_Email_Subject = () => {
  return `Forget Password request your account`;
};

const password_reset_Email_HTML = (user_mail_data) => {
  return `<h1>Password change successful</h1>
            <h2>Hello ${user_mail_data.result.user_name.firstName}</h2>
            <p>You Password is reset by You</p>
            </div>`;

  // <a href=${process.env.Local_PORT}/forgetpassword/passwordreset/${user_mail_data.token}> Click here</a>
};

const password_reset_Email_Subject = () => {
  return `Password reset successful`;
};

module.exports = {
  Forget_password_regenerate_Email_HTML,
  Forget_password_regenerate_Email_Subject,
  password_reset_Email_HTML,
  password_reset_Email_Subject,
};
