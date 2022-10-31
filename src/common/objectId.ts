import mongoose from 'mongoose';

/**
 * This is an alias to `mongoose.Types.ObjectId` and can
 * behave as both, a type, and a value.
 *
 * With the following implementation instead of an empty subclass
 * or a simple type alias it allows `MongooseObjectId` to function
 * as a value and a type and also conserve the instance type of any
 * instantiations as the same as `mongoose.Types.ObjectId` which
 * means and object is an instance of `MongooseObjectId` if and only if
 *  it is an instance of `mongoose.Types.ObjectId`
 *
 * https://github.com/microsoft/TypeScript/issues/2552#issuecomment-87893040
 */
export import MongooseObjectId = mongoose.Types.ObjectId;
