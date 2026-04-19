function proxyCompose(...layers) {
	return new Proxy({}, {
		get(_, prop, receiver) {
			// handle symbols properly (e.g. inspect, iterator)
			if (typeof prop === "symbol") {
				for (const layer of layers) {
					if (prop in layer) {
						return Reflect.get(layer, prop, receiver);
					}
				}
				return undefined;
			}

			for (const layer of layers) {
				if (prop in layer) {
					const value = Reflect.get(layer, prop, receiver);

					if (typeof value === "function") {
						return value.bind(receiver);
					}

					return value;
				}
			}

			return undefined;
		}
	});
}

function proxyComposeFb(...args) {
	if (args.length === 0) {
		throw new Error("proxyComposeFb requires at least a fallback function");
	}

	const fallback = args.pop();

	if (typeof fallback !== "function") {
		throw new Error("Last argument to proxyComposeFb must be a function");
	}

	const layers = args;

	return new Proxy({}, {
		get(_, prop, receiver) {
			// handle symbols properly
			if (typeof prop === "symbol") {
				for (const layer of layers) {
					if (prop in layer) {
						return Reflect.get(layer, prop, receiver);
					}
				}
				return undefined;
			}

			for (const layer of layers) {
				if (prop in layer) {
					const value = Reflect.get(layer, prop, receiver);

					if (typeof value === "function") {
						return value.bind(receiver);
					}

					return value;
				}
			}

			// fallback → turn into callable method
			return (...args) => fallback(prop, args, receiver);
		}
	});
}