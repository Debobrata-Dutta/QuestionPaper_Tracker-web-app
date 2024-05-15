const mongoose=require("mongoose")
const add_teacher=mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        require:true
    },
    type: {
        type: String,
        default: "sub_faculty"
    }

})
const teacher=new mongoose.model("add_teacher",add_teacher)
module.exports=teacher