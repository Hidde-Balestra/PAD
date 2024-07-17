class ProfileController {
    constructor() {
        userRepository.getUserInfo().then(users => {
            users.forEach(user =>{
                if (user.id == id){
                    console.log(user)
                    $("#firstname").val(user.firstname)
                    $("#lastname").val(user.lastname)
                    $("#email").val(user.email)
                }
            })
        })
        console.log(123)
    }
}








// let fileUpload = $("#file-input");
// $("#submitPFP").on("click", () => {
//     let fileReader = new FileReader();
//     fileReader.readAsDataURL(fileUpload.prop('files')[0]);
//     fileReader.onload = () => {
//         let imageString = JSON.stringify(fileReader.result);
//     window.display
//     }
// });