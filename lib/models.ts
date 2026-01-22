import mongoose from 'mongoose';

// Schema do Usuário (Login)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Schema dos Dados do Usuário
// strict: false permite que salvamos arrays de objetos (transactions) sem definir cada campo estritamente aqui
const UserDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  transactions: { type: Array, default: [] },
  categories: { type: Object, default: {} },
  paymentMethods: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

export const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as mongoose.Model<any>;
export const UserDataModel = (mongoose.models.UserData || mongoose.model('UserData', UserDataSchema)) as mongoose.Model<any>;