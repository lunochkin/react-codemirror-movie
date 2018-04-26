import React from 'react'
import Movie from '../../src/index'
import 'codemirror/lib/codemirror.css'
import jss from 'react-jss'


const decorate = jss({
  controls: {
    margin: [[20, 0]],
    height: 30
  },
  button: {
    fontSize: 13
  },
  tooltipRoot: {
    background: 'lightgrey'
  }
})


class App extends React.Component {

  state = {
    playing: false,
    content: `
      String email = request.getParameter('email');
      String password = request.getParameter('password');
      
      String sql = "select * from users where (email='" + email + "' and password ='" + password + "')";
      
      Connection connection = pool.getConnection();
      Statement statement = connection.createStatement();
      ResultSet result = statement.executeQuery(sql);

      if (result.next()) {
        loggedIn = true;
        // Successfully logged in and redirect to user profile page
      } else {
        // Auth failure - Redirect to Login Page
      }
      @@@
      tooltip: {"text": "To validate user credentials, the request.getParameter() method is first called to extract Alice's email (from the HTTP request parameter) which is assigned to the email variable.","pos":"0:8"}
      tooltip: {"text": "Similarly, the request.getParameter() method is called to extract Alice's password value and assigned to the password variable", "pos": "1:8"}
      tooltip: {"text": "The string variable sql is then declared, which represents the SQL query used to authenticate Alice's credentials\\n\\nNote that Alice's email and password values are concatenated to build the final query.", "pos": "3:9"}
      tooltip: {"text": "The SQL query defined in sql string variable is then executed by invoking the executeQuery method. This method executes our query against the backend SQL server and returns a ResultSet object which is checked on line 10 through the if/else block.\\n\\nFinally, should Alice's credentials match, the loggedIn variable is set to true and she is redirected to her profile page.", "pos": "7:30"}
    `
  }

  handleStart = () => {
    this.setState({
      playing: true
    })
  }

  handleStop = () => {
    this.setState({
      playing: false
    })
  }

  handleFinish = () => {
    this.handleStop()
  }

  render () {
    const {classes} = this.props

    return (
      <div>
        <div className={classes.controls}>
          {!this.state.playing &&
            <button className={classes.button} onClick={this.handleStart}>Play</button>
          }
        </div>
        <Movie
          value={this.state.content}
          onStop={this.handleStop}
          onFinish={this.handleFinish}
          playing={this.state.playing}
          options={{
            mode: 'text/x-java',
            theme: 'seti'
          }}
          tooltipClasses={{
            root: classes.tooltipRoot
          }}
        />
      </div>
    )
  }
}

export default decorate(App)
