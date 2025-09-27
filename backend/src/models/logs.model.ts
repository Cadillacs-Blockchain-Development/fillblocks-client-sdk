import mongoose, { Schema, Document } from "mongoose";

export interface ILog extends Document {
    time: Date;
    ip: string;
    device: string;
    window: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const logsSchema = new Schema<ILog>({
    time: {
        type: Date,
        required: true,
        default: Date.now
    },
    ip: {
        type: String,
        required: true,
        validate: {
            validator: function(v: string) {
                return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
            },
            message: (props: any) => `${props.value} is not a valid IP address!`
        }
    },
    device: {
        type: String,
        required: true,
        trim: true
    },
    window: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'logs'
});

logsSchema.index({ time: -1 });  
logsSchema.index({ ip: 1 }) 
logsSchema.index({ device: 1 }); 

const logsModel = mongoose.model<ILog>("logs", logsSchema);

export default logsModel;