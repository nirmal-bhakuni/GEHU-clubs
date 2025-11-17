// Lightweight module shims to silence TS7016 for packages that may not ship
// complete type declarations in this mono-repo build environment.

// minimal express types used in server code
// Provide an ambient `express` namespace so expressions like `express.Request`
// and `express.NextFunction` resolve in server code.
declare global {
	namespace express {
		interface Request {
			[key: string]: any;
			path?: string;
			method?: string;
		}
		interface Response {
			[key: string]: any;
			status?: any;
			json?: any;
			on?: any;
			statusCode?: any;
		}
		type NextFunction = (...args: any[]) => void;
		interface Express {
			use?: any;
			listen?: any;
			post?: any;
			get?: any;
			patch?: any;
			delete?: any;
			static?: any;
		}
		type Application = Express;
	}
}

declare module 'express' {
	export type Request = globalThis.express.Request;
	export type Response = globalThis.express.Response;
	export type NextFunction = globalThis.express.NextFunction;
	export type Express = globalThis.express.Application;

	const express: {
		(): Express;
		json: (...args: any[]) => any;
		urlencoded: (...args: any[]) => any;
		static: (...args: any[]) => any;
	};

	export default express;
}

declare module 'express-session' {
	const content: any;
	export default content;
}

declare module 'multer' {
	const content: any;
	export default content;
}

declare module 'bcryptjs' {
	const content: any;
	export default content;
}

declare module 'drizzle-orm' {
	export const sql: any;
}

declare module 'drizzle-orm/pg-core' {
	export function pgTable(...args: any[]): any;
	export function text(...args: any[]): any;
	export function varchar(...args: any[]): any;
	export function integer(...args: any[]): any;
	export function timestamp(...args: any[]): any;
}

declare module 'drizzle-zod' {
	export function createInsertSchema(...args: any[]): any;
}

declare module 'zod' {
	export namespace z {
		export type infer<T> = any;
	}
	export { z };
}

// add any other problematic modules here as needed
