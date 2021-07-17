const Login_Email_HTML = (user_mail_data) => {
  return `<h1>New Login To Your Account from ${
    user_mail_data.req.headers["user-agent"]
  } on ${user_mail_data.osInfo.platform}</h1>
        <h2>Hello ${user_mail_data.result.user_name.firstName}</h2>
        <p>If Not You!!!, Change your password by clicking on the following link</p>
        <a href=http://localhost:${
          process.env.PORT || 5555
        }/password> Click here</a>
        </div>`;
};

const Login_Email_Subject = (user_mail_data) => {
  return `New Login To Your Account from ${user_mail_data.req.headers["user-agent"]} on ${user_mail_data.osInfo.platform}`;
};

module.exports = { Login_Email_HTML, Login_Email_Subject };
