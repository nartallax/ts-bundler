(function(packageCode, modname, runEval, entryPoint, entryFunction, waitLoad, onPackageNotFound){
	var knownPackages = {
		require: function(name){
			return onPackageNotFound(name);
		}
	}

	var currentPackage = null;
	var define = function(reqs, fn){
		var pkgs = [];
		var result = null;
		for(var i = 0; i < reqs.length; i++){
			var r = modname.resolve(currentPackage, reqs[i]);
			if(r === "exports")
				pkgs.push(result = {});
			else if(!(r in knownPackages))
				pkgs.push(onPackageNotFound(r))
			else
				pkgs.push(knownPackages[r]);
		}
		fn.apply(null, pkgs);
		knownPackages[currentPackage] = result;
	}
	
	var run = function(){
		for(var i = 0; i < packageCode.length; i++){
			var pkgName = packageCode[i][0];
			var pkgCode = packageCode[i][1] + "\n//# sourceURL=" + pkgName;
			currentPackage = pkgName;
			try {
				runEval(pkgCode, define);
			} catch(e){
				if(typeof(packageEvalExceptionHandler) !== "undefined"){
					packageEvalExceptionHandler(e, pkgName);
				}
				throw e;
			}
			
			currentPackage = null;
		}
		knownPackages[entryPoint][entryFunction]();
	}
	
	waitLoad = waitLoad || function(cb){ cb() };
	waitLoad(run);
})