import React from 'react'
import { Text, TextInput, View, Image, Alert, TouchableOpacity, StyleSheet, KeyboardAvoidingView } from 'react-native'
import * as firebase from 'firebase';

export default class LoginScreen extends React.Component {
    constructor() {
        super();
        this.state = {
            emailId: '',
            password: ''
        }
    }
    login=async(email, password)=>{
        if(email&&password){
            try{
                const response=await firebase.auth().signInWithEmailAndPassword(email,password)
                if(response){
                    this.props.navigation.navigate('TabNavigator')
                }
            }

            catch(error){
                switch(error.code){
                    case 'auth/user-not-found': Alert.alert("User Does Not Exist");
                    break;
                    case 'auth/invalid-email': Alert.alert("Incorect Email or Password");
                    break;
                }
            }
        }
        else{
            Alert.alert("Enter Email Id and Password")
        }
    }
    render() {
        return (
            <KeyboardAvoidingView>
                <View>
                    <Image source={require("../assets/booklogo.jpeg")}
                        style={{ width: 200, height: 200 }} />
                    <Text style={{ textAlign: 'left', fontSize: 30 }}>WILY App</Text>
                </View>
                <View>
                    <TextInput style={styles.loginBox}
                        placeholder="Enter Your E-Mail ID"
                        keyboardType='email-address'
                        onChangeText={(text) => {
                            this.setState({
                                emailId: text
                            })
                        }} />

                    <TextInput style={styles.loginBox}
                        placeholder="Enter Your Password"
                        secureTextEntry={true}
                        onChangeText={(text) => {
                            this.setState({
                                password: text
                            })
                        }} />
                </View>
                <View>
                    <TouchableOpacity style={{width:90, height:30, borderWidth:1, marginTop:20, paddingTop:5, borderRadius:7 }}
                    onPress={()=>{
                        this.login(this.state.emailId, this.state.password)
                    }}>
                        <Text style={{textAlign:'center'}}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        )
    }
}

const styles=StyleSheet.create({
    loginBox:{
        width:300,
        height:40,
        borderWidth:1.5,
        fontSize:20,
        margin:10,
        paddingLeft:10
    }
})