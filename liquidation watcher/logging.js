const date = require('date-and-time')
const fs = require('fs')



//0 verbosity will only show critical and emergency messages
//1 shows errors and INFO
//2 shows warnings
//3 shows DEBUG
//all levels show messages from lower tiers



class Logger{
  constructor(outputPath=false, console=true, verbosity=0){
    this.outputPath = outputPath;
    this.console = console;
    if(verbosity > 3 || verbosity < 0)
      throw new Error("logger initialization error, verbosity defined outside of range (0-3)")
    this.verbosity = verbosity
  }

  debug(message){
    if(this.verbosity < 3)
      return;
    const debugString = date.format(new Date(), '(DD-MM-YYYY HH:mm:ss)') + ' [DEBUG] ' + message;
    if(this.console){
      console.log(debugString)
    }
    if(this.outputPath !== false){
      fs.appendFile(this.outputPath, debugString + "\n", (err) => {
        if(err) throw err;
      });
    }
  }

  info(message){
    if(this.verbosity < 1)
      return;
    const debugString = date.format(new Date(), '(DD-MM-YYYY HH:mm:ss)') + ' [INFO] ' + message;
    if(this.console){
      console.log(debugString)
    }
    if(this.outputPath !== false){
      fs.appendFile(this.outputPath, debugString + "\n", (err) => {
        if(err) throw err;
      });
    }
  }

  warn(message){
    if(this.verbosity < 2)
      return;
    const debugString = date.format(new Date(), '(DD-MM-YYYY HH:mm:ss)') + ' [WARN] ' + message;
    if(this.console){
      console.log(debugString)
    }
    if(this.outputPath !== false){
      fs.appendFile(this.outputPath, debugString + "\n", (err) => {
        if(err) throw err;
      });
    }
  }

  error(message){
    if(this.verbosity < 2)
      return;
    const debugString = date.format(new Date(), '(DD-MM-YYYY HH:mm:ss)') + ' [ERROR] ' + message;
    if(this.console){
      console.log(debugString)
    }
    if(this.outputPath !== false){
      fs.appendFile(this.outputPath, debugString + "\n", (err) => {
        if(err) throw err;
      });
    }
  }

  crit(message){
    const debugString = date.format(new Date(), '(DD-MM-YYYY HH:mm:ss)') + ' [CRITICAL] ' + message;
    if(this.console){
      console.log(debugString)
    }
    if(this.outputPath !== false){
      fs.appendFile(this.outputPath, debugString + "\n", (err) => {
        if(err) throw err;
      });
    }
  }

  emergency(message){
    const debugString = date.format(new Date(), '(DD-MM-YYYY HH:mm:ss)') + ' [EMERGENCY] ' + message;
    if(this.console){
      console.log(debugString)
    }
    if(this.outputPath !== false){
      fs.appendFile(this.outputPath, debugString + "\n", (err) => {
        if(err) throw err;
      });
    }
  }
}

var conf = fs.readFileSync(__dirname + '/initialization/config.json');
const config = JSON.parse(conf);

module.exports = new Logger(outputPath=config.logFile, console=config.logToConsole,
  verbosity=config.loggingVerbosity);