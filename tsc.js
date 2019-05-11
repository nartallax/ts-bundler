let { shellExecute } = require("./shell_execute"),
	fail = require("./fail"),
	path = require("path"),
	fs = require("./fs")

let npmRoot = null;
let findNpmRoot = async () => {
	if(!npmRoot){
		npmRoot = (await shellExecute("npm config get prefix")).stdout.replace(/(^[\n\r\s\t]+|[\n\r\s\t]+$)/g, "");
	}
	return npmRoot;
}

let resolvedExecutables = new Map();

let findTscExecutable = async (tsconfigPath, silent) => {
	tsconfigPath = path.normalize(tsconfigPath);
	if(!resolvedExecutables.has(tsconfigPath)){
		let tscExecPaths = [];
		
		// сначала пробуем искать в директории проекта или выше по дереву директорий, вплоть до корня
		let cwd = process.cwd();
		while(true){
			let newPath = path.resolve(cwd, "./node_modules/.bin/tsc");
			tscExecPaths.push(newPath);
			let newCwd = path.resolve(cwd, "..");
			if(newCwd === cwd)
				break;
			cwd = newCwd;
		}
		
		// затем пробуем искать в директории самого бандлера
		tscExecPaths.push(path.resolve(__dirname, "./node_modules/.bin/tsc"));
		
		// затем ищем глобально установленный
		let npmRoot = await findNpmRoot();
		tscExecPaths.push(path.resolve(npmRoot, "./tsc"));
		tscExecPaths.push(path.resolve(npmRoot, "./bin/tsc"));
		
		let validPaths = (await Promise.all(tscExecPaths.map(async epath => {
			try {
				let stat = await fs.stat(epath);
				return stat.isFile()? epath: null;
			} catch(e){
				return null;
			}
		}))).filter(x => !!x)
		
		var tscExecutable = validPaths[0];
		
		tscExecutable || fail("TSC is not installed. Expected tsc executable to be at one of paths: \n\t" + tscExecPaths.join("\n\t"));
		
		silent || console.error("Using tsc in " + tscExecutable + " for " + tsconfigPath);
		
		resolvedExecutables.set(tsconfigPath, tscExecutable);
	}
	
	return resolvedExecutables.get(tsconfigPath);
}

module.exports = {
	run: async (tsconfigPath, opts, silent) => {
		let optStr = [];
		Object.keys(opts).forEach(name => {
			optStr.push((name.length === 1? "-": "--") + name);
			optStr.push(opts[name]);
		});
		optStr = optStr.join(" ");
		
		let tscPath = await findTscExecutable(tsconfigPath, silent);
		tscPath = path.relative(process.cwd(), tscPath);
		try {
			//let execRes = await shellExecuteFile(path.relative(process.cwd(), tscPath), optStr);
			let execRes = await shellExecute(tscPath + " " + optStr);
		} catch(e){
			if(e.stdout || e.stderr)
				fail(e.stdout || e.stderr);
			else
				throw e;
		}
	}
}