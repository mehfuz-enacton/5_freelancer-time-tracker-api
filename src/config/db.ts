import mongoose from 'mongoose';

mongoose.pluralize(null);

const connection = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed",error);
    process.exit(1);
  }
};

export default connection;
