import express from 'express';
import {ClassroomClient} from '../../../helpers/classroom';
import {numberFromData, request, Validators} from '../../../helpers/request';
import {IStoreDoc, IUserDoc, Store, StoreItem} from '../../../helpers/schema';
import {IStoreItemDoc, requestHasUser} from '../../../types';
const router = express.Router();

async function getStorePerms(
	store: IStoreDoc,
	user: IUserDoc,
): Promise<{
	view: boolean;
	manage: boolean;
}> {
	let view = false,
		manage = false,
		classroomClient = await new ClassroomClient().createClient(user);

	if (user.hasRole('ADMIN')) {
		manage = true;
	} else if (store.managers.includes(user.id)) {
		manage = true;
	} else if (store.classID && classroomClient) {
		const teaching = await classroomClient
			.getClassesForRole('TEACHER')
			.then(x => (x || []).map(x => x.id));

		if (teaching.includes(store.classID)) manage = true;
	}

	if (manage)
		return {
			view: true,
			manage,
		};

	if (store.public) {
		view = true;
	} else if (store.classID && classroomClient) {
		const classes = await classroomClient
			.getClassesForRole('STUDENT')
			.then(x => (x || []).map(x => x.id));

		if (classes.includes(store.classID)) view = true;
	}

	return {view, manage};
}

router.get(
	'/store/:id',
	async (req, res, next) =>
		request(req, res, next, {
			authentication: true,
			validators: {
				params: {
					id: Validators.string,
				},
			},
		}),
	async (req, res) => {
		try {
			if (!requestHasUser(req)) return;

			const {id} = req.params;

			const store = await Store.findById(id)
				.then(store => {
					if (!store) {
						res.status(404).send('Store not found');
						return null;
					}
					return store;
				})
				.catch(() => {
					res.status(400).send('Invalid ID');
					return null;
				});

			if (!store) return;

			const permissions = await getStorePerms(store, req.user);
			if (!permissions.view) return res.status(403).send('Forbidden');

			const {name, description} = store;

			return res.status(200).send({
				name,
				description,
				canManage: permissions.manage,
			});
		} catch (e) {
			try {
				res.status(500).send('Something went wrong.');
			} catch (e) {}
		}
	},
);

router.get(
	'/store/:id/items',
	async (req, res, next) =>
		request(req, res, next, {
			authentication: true,
			validators: {
				params: {
					id: Validators.string,
				},
				query: {
					count: Validators.optional(
						Validators.and(Validators.integer, Validators.gt(0)),
					),
					page: Validators.optional(
						Validators.and(Validators.integer, Validators.gt(0)),
					),
				},
			},
		}),
	async (req, res) => {
		if (!requestHasUser(req)) return;

		const {id} = req.params;

		const store = await Store.findById(id)
			.then(store => {
				if (!store) {
					res.status(404).send('Store not found');
					return null;
				}
				return store;
			})
			.catch(() => {
				res.status(400).send('Invalid ID');
				return null;
			});

		if (!store) return;

		const permissions = await getStorePerms(store, req.user);
		if (!permissions.view) return res.status(403).send('Forbidden');

		let count = numberFromData(req.query.count) ?? 10;
		let page = numberFromData(req.query.page) ?? 1;

		const query = StoreItem.find().byStoreID(id);

		const [items, docCount] = await Promise.all([
			query
				.setOptions({
					skip: (page - 1) * count,
					limit: count,
				})
				.exec(),
			query.clone().countDocuments().exec(),
		]);

		res.status(200).send({
			page,
			pageCount: Math.ceil(docCount / count),
			docCount,
			items: items.map(i => ({
				_id: i._id,
				name: i.name,
				description: i.description,
				quantity: i.quantity,
				price: i.price,
			})),
		});
	},
);

router.get(
	'/store/:storeID/item/:id',
	async (req, res, next) =>
		request(req, res, next, {
			authentication: true,
			validators: {
				params: {
					storeID: Validators.string,
					id: Validators.string,
				},
				query: {
					count: Validators.optional(
						Validators.and(Validators.integer, Validators.gt(0)),
					),
					page: Validators.optional(
						Validators.and(Validators.integer, Validators.gt(0)),
					),
				},
			},
		}),
	async (req, res) => {
		if (!requestHasUser(req)) return;

		const {storeID, id} = req.params;

		const store = await Store.findById(storeID)
			.then(store => {
				if (!store) {
					res.status(404).send('Store not found');
					return null;
				}
				return store;
			})
			.catch(() => {
				res.status(400).send('Invalid ID');
				return null;
			});

		if (!store) return;

		const permissions = await getStorePerms(store, req.user);
		if (!permissions.view) return res.status(403).send('Forbidden');

		const item = await StoreItem.findById(id)
			.then(item => {
				if (!item || item.storeID != storeID) {
					res.status(404).send('Item not found');
					return null;
				}
				return item;
			})
			.catch(() => {
				res.status(400).send('Invalid ID');
				return null;
			});

		if (!item) return;

		res.status(200).send({
			_id: item._id,
			name: item.name,
			description: item.description,
			quantity: item.quantity,
			price: item.price,
		});
	},
);

router.patch(
	'/store/:storeID/item/:id',
	async (req, res, next) =>
		request(req, res, next, {
			authentication: true,
			validators: {
				params: {
					storeID: Validators.string,
					id: Validators.string,
				},
				body: {
					name: Validators.optional(Validators.string),
					description: Validators.optional(Validators.string),
					price: Validators.optional(Validators.number),
					quantity: Validators.optional(Validators.number),
				},
			},
		}),
	async (req, res) => {
		try {
			if (!requestHasUser(req)) return;

			const {storeID, id} = req.params;
			let data = req.body;

			Object.keys(data).forEach(key => {
				if (
					!['name', 'description', 'price', 'quantity'].includes(
						key,
					) ||
					data[key] == null ||
					data[key] == undefined
				)
					delete data[key];
			});

			const store = await Store.findById(storeID)
				.then(store => {
					if (!store) {
						res.status(404).send('Store not found');
						return null;
					}
					return store;
				})
				.catch(() => {
					res.status(400).send('Invalid ID');
					return null;
				});

			if (!store) return;

			const permissions = await getStorePerms(store, req.user);
			if (!permissions.manage) return res.status(403).send('Forbidden');

			const item = await StoreItem.findById(id)
				.then(item => {
					if (!item || item.storeID != storeID) {
						res.status(404).send('Item not found');
						return null;
					}
					return item;
				})
				.catch(() => {
					res.status(400).send('Invalid ID');
					return null;
				});

			if (!item) return;

			Object.assign(item, data);

			await item.save();

			res.status(200).send({
				_id: item._id,
				name: item.name,
				description: item.description,
				quantity: item.quantity,
				price: item.price,
			});
		} catch (e) {
			try {
				res.status(500).send('Something went wrong.');
			} catch (e) {}
		}
	},
);

router.delete(
	'/store/:storeID/item/:id',
	async (req, res, next) =>
		request(req, res, next, {
			authentication: true,
			validators: {
				params: {
					storeID: Validators.string,
					id: Validators.string,
				},
				body: {
					name: Validators.optional(Validators.string),
					description: Validators.optional(Validators.string),
					price: Validators.optional(Validators.number),
					quantity: Validators.optional(Validators.number),
				},
			},
		}),
	async (req, res) => {
		try {
			if (!requestHasUser(req)) return;

			const {storeID, id} = req.params;

			const store = await Store.findById(storeID)
				.then(store => {
					if (!store) {
						res.status(404).send('Store not found');
						return null;
					}
					return store;
				})
				.catch(() => {
					res.status(400).send('Invalid ID');
					return null;
				});

			if (!store) return;

			const permissions = await getStorePerms(store, req.user);
			if (!permissions.manage) return res.status(403).send('Forbidden');

			const item = await StoreItem.findById(id)
				.then(item => {
					if (!item || item.storeID != storeID) {
						res.status(404).send('Item not found');
						return null;
					}
					return item;
				})
				.catch(() => {
					res.status(400).send('Invalid ID');
					return null;
				});

			if (!item) return;

			await item.delete();

			res.status(200).send();
		} catch (e) {
			try {
				res.status(500).send('Something went wrong.');
			} catch (e) {}
		}
	},
);

router.post(
	'/store/:storeID/items',
	async (req, res, next) =>
		request(req, res, next, {
			authentication: true,
			validators: {
				params: {
					storeID: Validators.string,
				},
				body: {
					name: Validators.string,
					description: Validators.string,
					price: Validators.number,
					quantity: Validators.optional(Validators.number),
				},
			},
		}),
	async (req, res) => {
		try {
			if (!requestHasUser(req)) return;

			const {storeID} = req.params;
			const {name, quantity, description, price} = req.body;

			const store = await Store.findById(storeID)
				.then(store => {
					if (!store) {
						res.status(404).send('Store not found');
						return null;
					}
					return store;
				})
				.catch(() => {
					res.status(400).send('Invalid ID');
					return null;
				});

			if (!store) return;

			const permissions = await getStorePerms(store, req.user);
			if (!permissions.manage) return res.status(403).send('Forbidden');

			const item = await new StoreItem({
				storeID,
				name,
				quantity,
				description,
				price,
			}).save();

			if (!item) return res.status(500).send('Failed to create item');

			return res.status(200).send({
				_id: item._id,
				name: item.name,
				description: item.description,
				quantity: item.quantity,
				price: item.price,
			});
		} catch (e) {
			try {
				res.status(500).send('Something went wrong.');
			} catch (e) {}
		}
	},
);

export default router;
