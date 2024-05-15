const mongoose=require("mongoose")
const question_info =mongoose.Schema({
    courseName:{
        type:String,
        required:false
    },
    facultyMail:{
      type:String,
      required:false
    },
    courseCode:{
        type:String,
        require:false
    },
    assignedFaculty:{
        type:String,
        require:false
    },
    Status: {
        type: String,
        default: "Not Submitted"
    },
    file:{
        type:String,
        require:false
    }
})
const question=new mongoose.model("question_info",question_info)
module.exports=question