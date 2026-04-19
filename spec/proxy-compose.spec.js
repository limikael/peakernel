import {proxyCompose, proxyComposeFb} from "../js/utils/proxy-compose.js";

describe("proxy-compose",()=>{
	it("can compose proxies",()=>{
		class A {
			hello() {
				return 123;
			}
		}

		class B {
			world() {
				return 456;
			}
		}

		let w=proxyCompose(new A(),new B());

		expect(w.hello()).toEqual(123);
		expect(w.world()).toEqual(456);
	});

	it("can compose proxies with fallback",async ()=>{
		class A {
			hello() {
				return 123;
			}
		}

		class B {
			world() {
				return 456;
			}
		}

		let fbcalled;
		let w=proxyComposeFb(new A(),new B(),async (func,args)=>{
			expect(func).toEqual("bla");
			expect(args).toEqual([1,2,3]);
			fbcalled=true;

			return "hello";
		});

		expect(w.hello()).toEqual(123);
		expect(w.world()).toEqual(456);
		let v=await w.bla(1,2,3);
		expect(v).toEqual("hello");
		expect(fbcalled).toBeTrue();
	});
});