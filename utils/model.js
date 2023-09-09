import mongoDB from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()
const uri = process.env.DB
const { MongoClient } = mongoDB
export const instance = new MongoClient(uri)
export const init = async () => {
  try {
    await instance.connect()
    const scripts = {
      collection: instance.db('lisper').collection('scripts'),
      findOneAndUpdate: async ({ title, portal, script }) => {
        if (script !== null) {
          const query = { title, portal }
          const update = {
            $set: { script },
          }
          const options = { upsert: true }
          try {
            await scripts.collection.findOneAndUpdate(query, update, options)
          } catch (error) {
            console.log({ error })
          }
        }
      },
      findOne: async (query) => await scripts.collection.findOne(query),
      findMany: async (query, pagination) =>
        await scripts.collection
          .find(query)
          .sort({ $natural: -1 })
          .limit(pagination.limit)
          .skip(pagination.skip * pagination.limit)
          .project({ _id: 0, script: 0 })
          .toArray(),
    }
    const portals = {
      collection: instance.db('lisper').collection('portals'),
      insertOne: async ({ username, password }) => {
        const query = { username, password }
        try {
          await portals.collection.insertOne(query)
        } catch (error) {}
      },
      findOne: async (query) => await portals.collection.findOne(query),
    }
    return { scripts, portals }
    // mongoScripts.deleteOne = async query => {
    //   try {
    //     const record = await mongoScripts.findOneFromScripts(query);
    //     if (record) {
    //       const timeStamp = new Date().getTime();
    //       const archived = {
    //         name: record.name + '_' + timeStamp,
    //         script: record.script,
    //         userId: record.userId
    //       };
    //       await mongoArchive.collection.insertOne(archived);
    //       return await mongoScripts.collection.findOneAndDelete(query);
    //     }
    //     return null;
    //   } catch (err) {
    //     console.log(err);
    //     return null;
    //   }
    // };
    // mongoScripts.deleteMany = async query =>
    //   await mongoScripts.collection.deleteMany(query);
    // const currentStamp = new Date().getTime();
    // mongoPortals.findManyFromPortals().then(portals =>
    //   portals.forEach(({ name, hash, stamp }) => {
    //     if (stamp && stamp > currentStamp) usersCreds[name] = hash;
    //   })
    // );
  } catch (error) {
    console.log(error)
  }
}
